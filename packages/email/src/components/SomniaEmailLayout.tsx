import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Tailwind,
  Font,
} from "@react-email/components";

interface SomniaEmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export const SomniaEmailLayout: React.FC<SomniaEmailLayoutProps> = ({
  children,
  previewText = "Message from Somnia",
}) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="JetBrains Mono"
          fallbackFontFamily="monospace"
          webFont={{
            url: "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwI.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                limbo: "#0A0A0F",
                totem: "#C9933A",
                "totem-hover": "#E8B455",
                primary: "#EEF3F8",
                secondary: "#8BA3BF",
              },
              fontFamily: {
                mono: ['"JetBrains Mono"', "monospace"],
              },
            },
          },
        }}
      >
        <Body className="bg-limbo text-primary font-mono m-0 py-8 px-4">
          <Container className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] rounded p-8 shadow-lg max-w-[600px] mx-auto text-left">
            <div className="mb-8 flex items-center gap-2">
              <span className="text-totem font-bold text-lg tracking-widest uppercase">
                SOMNIA
              </span>
              <span className="text-secondary/40 text-xs tracking-widest uppercase">
                // System Output
              </span>
            </div>

            {children}

            <div className="mt-10 pt-6 border-t border-[rgba(200,216,232,0.1)] text-xs text-secondary/60 uppercase tracking-widest">
              <p>Layer 0 — Reality</p>
              <p className="mt-1">Somnia Workshop / Automated Projection</p>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SomniaEmailLayout;
