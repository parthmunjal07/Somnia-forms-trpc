import * as React from "react";
import { Text } from "@react-email/components";
import SomniaEmailLayout from "../components/SomniaEmailLayout";

interface SurfacingConfirmationProps {
  formTitle: string;
  submissionTime: string;
}

export const SurfacingConfirmation: React.FC<SurfacingConfirmationProps> = ({
  formTitle = "Project Inception",
  submissionTime = new Date().toISOString(),
}) => {
  return (
    <SomniaEmailLayout previewText={`Your response to ${formTitle} was recorded`}>
      <Text className="text-xl font-bold tracking-widest text-primary uppercase mb-6 mt-4">
        Signal Confirmed
      </Text>
      
      <Text className="text-sm leading-7 text-secondary/80 mb-6">
        You have successfully resurfaced. Your signals for <strong className="text-primary">{formTitle}</strong> have been securely extracted and recorded by the architect.
      </Text>

      <div className="bg-[rgba(10,10,15,0.5)] border border-[rgba(200,216,232,0.05)] p-4 rounded-sm mb-6">
        <Text className="text-[10px] text-secondary/50 tracking-widest uppercase m-0 mb-1">
          Extraction Time
        </Text>
        <Text className="text-sm text-primary m-0">
          {new Date(submissionTime).toUTCString()}
        </Text>
      </div>

      <Text className="text-xs text-secondary/60 leading-6 mt-8">
        No further action is required on your part. 
        You may now safely close this loop.
      </Text>
    </SomniaEmailLayout>
  );
};

export default SurfacingConfirmation;
