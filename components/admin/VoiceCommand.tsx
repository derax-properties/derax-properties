"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { parseVoiceCommand } from "@/lib/voiceCommands";
import { MicIcon } from "./icons";

type ListenState = "idle" | "listening" | "processing" | "error";

/**
 * Tap-to-talk voice search for the CRM (step 1 of 2 — an always-listening
 * wake phrase comes next, on top of this same command engine once this is
 * proven reliable). Lives in the Topbar next to the text search box, so
 * it's available on every admin page.
 *
 * How it works, end to end:
 *  1. Tap the mic → the browser's built-in speech recognition listens for
 *     one phrase (no server round trip, no extra cost).
 *  2. The transcript is matched against known commands in
 *     lib/voiceCommands.ts ("today's follow-ups", "new leads", "hot
 *     leads", or a bare name/address) and turned into the same
 *     /admin/leads?… URL the existing filters already use.
 *  3. After navigating, this polls briefly for a hidden
 *     [data-voice-announce] element that the destination page renders
 *     with a human-readable result summary, and reads it aloud with the
 *     browser's built-in text-to-speech — so you both see the filtered
 *     list and hear "5 leads — Follow-ups due today" without having to
 *     look at the screen first.
 *
 * Nothing here touches existing search/filter logic — it only drives the
 * URL params those already understand.
 */
export function VoiceCommand() {
  const router = useRouter();
  const [state, setState] = useState<ListenState>("idle");

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Called right after router.push() for a voice command. Waits briefly for
  // the destination page's hidden result summary to show up in the DOM
  // (server-rendered content can arrive a beat after the URL changes) and
  // speaks it. Polling a DOM node here — rather than an effect keyed on the
  // route — works no matter whether the pathname actually changed (e.g.
  // going from one /admin/leads filter straight to another).
  const announceWhenReady = useCallback(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      const el = document.querySelector("[data-voice-announce]");
      if (el?.textContent?.trim()) {
        speak(el.textContent.trim());
        clearInterval(interval);
      } else if (attempts > 20) {
        clearInterval(interval); // ~4s — give up quietly, the list is still on screen
      }
    }, 200);
  }, [speak]);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      speak("Voice commands aren't supported in this browser yet.");
      setState("error");
      window.setTimeout(() => setState("idle"), 2000);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState("listening");
    recognition.onerror = () => {
      setState("error");
      window.setTimeout(() => setState("idle"), 1500);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript as string | undefined;
      setState("processing");
      if (!transcript) {
        speak("Sorry, I didn't catch that.");
        return;
      }
      const result = parseVoiceCommand(transcript);
      if (result.type === "navigate") {
        router.push(result.url);
        announceWhenReady();
      } else {
        speak("Sorry, I didn't catch that. Try again.");
      }
    };
    recognition.onend = () => {
      setState((s) => (s === "listening" ? "idle" : s));
    };

    recognition.start();
  }, [router, speak, announceWhenReady]);

  return (
    <button
      type="button"
      onClick={startListening}
      aria-label="Voice command"
      title={
        state === "listening"
          ? "Listening…"
          : 'Tap and say a command — e.g. "today\'s follow-ups", "new leads", or a lead\'s name'
      }
      className={`crm-water-hover focus-gold relative shrink-0 rounded-full p-2 transition-colors ${
        state === "listening"
          ? "crm-voice-listening bg-gold/20 text-gold-dark"
          : state === "error"
          ? "text-red-500"
          : "text-ink/50 hover:bg-ink/5"
      }`}
    >
      <MicIcon className="h-5 w-5" />
    </button>
  );
}
