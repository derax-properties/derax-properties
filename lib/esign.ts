/**
 * E-signature provider interface. No real provider (DocuSign, Dropbox
 * Sign/HelloSign, SignNow) is wired up in this environment — none of
 * their API keys are configured. `ManualEsignProvider` is the honest
 * fallback: it doesn't fabricate a "sent" status by calling an API that
 * isn't there, it just gives the admin explicit buttons to record what
 * actually happened (they send the document themselves, however they
 * currently do it, and mark the status here). Swapping in a real provider
 * later means writing one more class that implements this interface and
 * changing one line where it's constructed — nothing else in the app
 * needs to change.
 */

export type EsignStatus = "Not Sent" | "Sent" | "Viewed" | "Signed" | "Declined" | "Voided";

export interface EsignProvider {
  name: string;
  /** Returns an envelope/document id from the provider, or null if this provider doesn't track one. */
  send(documentUrl: string, signerEmail: string | null): Promise<{ envelopeId: string | null }>;
}

export class ManualEsignProvider implements EsignProvider {
  name = "manual";
  async send(): Promise<{ envelopeId: string | null }> {
    // No API call — this provider exists purely so the rest of the app
    // has a consistent "provider.send()" step to call, and to make it
    // obvious in code review that no real e-signature service is wired up
    // yet.
    return { envelopeId: null };
  }
}

export function getEsignProvider(): EsignProvider {
  // When a real provider's credentials are added to the environment,
  // branch on them here (e.g. `if (process.env.DOCUSIGN_API_KEY) return new DocuSignProvider()`).
  return new ManualEsignProvider();
}
