"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/Usercontext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  idRoom?: string;
  idTargetedUser?: string;
  roomTitle?: string;
  targetedName?: string;
  isSuggestion?: boolean; // New prop
}

export default function ReportModal({
  isOpen,
  onClose,
  idRoom,
  idTargetedUser,
  roomTitle,
  targetedName,
  isSuggestion = false, // Default to false
}: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const { idUser } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("⚠️ Image too large. Maximum size is 3MB.");
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async () => {
    // Determine the type of submission for alerts/messages
    const type = isSuggestion ? "suggestion" : "report";
    const title = isSuggestion ? "Suggestion" : "Report";
    
    if (!reason.trim()) {
      alert(`⚠️ Please provide a detailed ${isSuggestion ? 'suggestion or bug report' : 'reason for the report'}.`);
      return;
    }
    if (reason.trim().length < 10) {
      alert(`⚠️ The ${isSuggestion ? 'suggestion/reason' : 'reason'} is too short. Please enter at least 10 characters.`);
      return;
    }

    setLoading(true);

    // 1️⃣ Create a report/suggestion record first
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          reporter_id: idUser,
          targeted_user_id: idTargetedUser || null,
          room_id: idRoom || null,
          reason,
          status: "pending", // Keep status as 'pending' for Admin review, regardless of type
          type: type, // IMPORTANT: New field to distinguish between reports and suggestions
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      console.error(`❌ Error creating ${type}:`, error);
      alert(`❌ Failed to submit the ${title}!`);
      setLoading(false);
      return;
    }

    const reportId = data.id;
    let proofUrl = null;

    // 2️⃣ If there’s a file → upload it to the bucket proof/reportId/
    if (proofFile) {
      const formData = new FormData();
      formData.append("reportId", reportId);
      formData.append("file", proofFile);

      const res = await fetch("/api/proof", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result?.url) {
        proofUrl = result.url;
        await supabase.from("reports").update({ proof: proofUrl }).eq("id", reportId);
      } else {
        console.error("❌ File upload error:", result);
      }
    }

    alert(`✅ Your ${title} has been submitted. Thank you!`);
    setReason("");
    setProofFile(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSuggestion ? "💡 Submit a Suggestion" : "🚩 Submit a Report"}
          </DialogTitle>
          <DialogDescription>
            {isSuggestion
              ? "Share your ideas for improvement, feature requests, or bug reports for the application."
              : "Please provide a detailed reason and (optional) upload proof images. We’ll review your report as soon as possible."
            }
          </DialogDescription>
        </DialogHeader>

        {/* Only display target details if it is a report, not a suggestion */}
        {!isSuggestion && (
          <div className="space-y-2 text-sm text-gray-700">
            {roomTitle && (
              <p>
                🏠 <strong>Room:</strong> {roomTitle}
              </p>
            )}
            {targetedName && (
              <p>
                👤 <strong>Reported User:</strong> {targetedName}
              </p>
            )}
          </div>
        )}

        <Textarea
          placeholder={isSuggestion ? "Enter your detailed suggestion or bug report..." : "Enter a detailed reason for your report..."}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[120px] mt-3"
          maxLength={300}
        />
        <p className="text-right text-xs text-gray-400">
          {reason.length}/300 characters
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🖼️ Proof image (optional):
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 
                        file:rounded-md file:border-0 file:text-sm file:font-semibold 
                        file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {proofFile && (
            <p className="text-xs text-gray-500 mt-1">
              📎 Selected: {proofFile.name}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : (isSuggestion ? "Submit Suggestion" : "Submit Report")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}