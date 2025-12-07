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
import { toast } from "sonner";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  idRoom?: string;
  idTargetedUser?: string;
  roomTitle?: string;
  targetedName?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  idRoom,
  idTargetedUser,
  roomTitle,
  targetedName,
}: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const { idUser } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.warning("⚠️ Image too large. Maximum size is 3MB.");
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.warning("⚠️ Please provide a reason for the report.");
      return;
    }
    if (reason.trim().length < 10) {
      toast.warning("⚠️ The reason is too short. Please enter at least 10 characters.");
      return;
    }

    setLoading(true);

    // 1️⃣ Create a report record first
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          reporter_id: idUser,
          targeted_user_id: idTargetedUser || null,
          room_id: idRoom || null,
          reason,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      console.error("❌ Error creating report:", error);
      toast.error("❌ Failed to submit the report!");
      setLoading(false);
      return;
    }

    const reportId = data.id;
    let proofUrl = null;
    console.log("File object:", proofFile);
    console.log("Type:", proofFile?.type, "Size:", proofFile?.size);

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

    toast.success("✅ Your report has been submitted. Thank you!");
    setReason("");
    setProofFile(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🚩 Submit a Report</DialogTitle>
          <DialogDescription>
            Please provide a detailed reason and (optional) upload proof images.  
            We’ll review your report as soon as possible.
          </DialogDescription>
        </DialogHeader>

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

        <Textarea
          placeholder="Enter a detailed reason for your report..."
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
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
