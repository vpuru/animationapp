import React from "react";

export default function EndorsementCard() {
  return (
    <div
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border shadow-sm"
      style={{ backgroundColor: "#cee5f5", borderColor: "#284B63" }}
    >
      <span className="text-sm font-medium text-black"> - Your stickers</span>
    </div>
  );
}
