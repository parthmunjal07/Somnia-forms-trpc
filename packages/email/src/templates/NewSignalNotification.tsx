import * as React from "react";
import { Text, Button } from "@react-email/components";
import SomniaEmailLayout from "../components/SomniaEmailLayout";

interface NewSignalNotificationProps {
  formTitle: string;
  timestamp: string;
  fieldPreviews: { label: string; value: string }[];
  dashboardUrl: string;
}

export const NewSignalNotification: React.FC<NewSignalNotificationProps> = ({
  formTitle = "Project Inception",
  timestamp = new Date().toISOString(),
  fieldPreviews = [
    { label: "Target", value: "Robert Fischer" },
    { label: "Depth", value: "Level 3" },
    { label: "Architect", value: "Ariadne" },
  ],
  dashboardUrl = "http://localhost:3000/dashboard",
}) => {
  return (
    <SomniaEmailLayout previewText={`New signal captured on ${formTitle}`}>
      <Text className="text-xl font-bold tracking-widest text-primary uppercase mb-6 mt-4">
        Signal Detected
      </Text>
      
      <Text className="text-sm leading-7 text-secondary/80 mb-6">
        A new response has been captured in your dreamscape: <strong className="text-primary">{formTitle}</strong>.
      </Text>

      <div className="bg-[rgba(10,10,15,0.5)] border border-[rgba(200,216,232,0.05)] p-4 rounded-sm mb-6">
        <Text className="text-xs text-totem tracking-widest uppercase mb-4 mt-0">
          Extraction Preview
        </Text>
        
        {fieldPreviews.map((field, idx) => (
          <div key={idx} className="mb-3">
            <Text className="text-[10px] text-secondary/50 tracking-widest uppercase m-0 mb-1">
              {field.label}
            </Text>
            <Text className="text-sm text-primary m-0">
              {field.value}
            </Text>
          </div>
        ))}
      </div>

      <Text className="text-[10px] text-secondary/40 tracking-widest uppercase mb-6">
        Timestamp: {new Date(timestamp).toUTCString()}
      </Text>
      
      <Button
        href={dashboardUrl}
        className="bg-totem text-limbo font-bold text-xs tracking-widest uppercase px-6 py-4 rounded-sm mt-2 border-none"
      >
        View Full Projection
      </Button>
    </SomniaEmailLayout>
  );
};

export default NewSignalNotification;
