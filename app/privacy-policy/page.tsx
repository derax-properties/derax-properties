import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Derax Properties collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="bg-cream-soft">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-6 text-ink/70">
          <p>
            Derax Properties (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your
            privacy. This Privacy Policy explains what information we collect through this
            website, how we use it, and the choices you have.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">Information We Collect</h2>
          <p>
            When you submit a property, request property details, or contact us, we may collect
            information such as your name, phone number, email address, property address, and
            details about the property and your situation. If you upload photos or documents, we
            store those files securely in connection with your submission.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">How We Use Information</h2>
          <p>
            We use the information you provide to evaluate property opportunities, respond to
            inquiries, and communicate with you about your submission or request. We do not sell
            your personal information to third parties.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">Communications</h2>
          <p>
            By submitting a form on this website, you agree that Derax Properties may contact you
            regarding your inquiry using the phone number, email address, or other contact
            information you provided, including by phone, text message, or email. Message and
            data rates may apply. You may opt out of communications at any time by replying STOP
            to a text message or contacting us at info@deraxproperties.com.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">Data Security</h2>
          <p>
            We use reasonable administrative and technical safeguards to protect the information
            you provide, including restricting access to seller and buyer submissions to
            authorized team members only.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:info@deraxproperties.com" className="text-gold-dark hover:underline">
              info@deraxproperties.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
