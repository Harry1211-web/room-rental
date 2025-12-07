"use client";

import { EditablePopup } from "./Popup";
import * as React from "react";

interface DeleteConfirmModalProps<T> {
  item: T | null; 
  itemKey: keyof T; 
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
  cleanupMessage?: string; 
}

export function DeleteConfirmModal<T extends { id: string | null }>(
  { item, itemKey, itemName = "item", onClose, onConfirm, cleanupMessage }: DeleteConfirmModalProps<T>
) {
  if (!item) return null;

  //Use the specified key for display, or fall back to 'id'
  const displayValue = item[itemKey] as string | number | null;
  const itemDisplay = displayValue ?? item.id; 

  return (
    <EditablePopup
      open={!!item}
      title={`Confirm Deletion of ${itemName}`}
      data={{}}
      onClose={onClose}
      onSave={onConfirm}
      saveLabel={`Yes, Delete ${itemName}`}
      isDeleteAction={true}
      fields={[]}
    >
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Are you sure you want to permanently delete this {itemName}:{" "}
        <strong className="text-red-600">{itemDisplay}</strong>?
        {cleanupMessage && (
          <>
            <br />
            This action will also **{cleanupMessage}**.
          </>
        )}
        <br />
        This action is irreversible.
      </p>
    </EditablePopup>
  );
}