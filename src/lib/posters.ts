import interstellarEcho from "@/assets/poster-interstellar-echo.jpg";
import neonBazaar from "@/assets/poster-neon-bazaar.jpg";
import monsoonLetters from "@/assets/poster-monsoon-letters.jpg";
import theLastSignal from "@/assets/poster-the-last-signal.jpg";
import paperTigers from "@/assets/poster-paper-tigers.jpg";
import kaalChakra from "@/assets/poster-kaal-chakra.jpg";
import deepBlueSilence from "@/assets/poster-deep-blue-silence.jpg";
import starlightCircus from "@/assets/poster-starlight-circus.jpg";

export const POSTERS: Record<string, string> = {
  "interstellar-echo": interstellarEcho,
  "neon-bazaar": neonBazaar,
  "monsoon-letters": monsoonLetters,
  "the-last-signal": theLastSignal,
  "paper-tigers": paperTigers,
  "kaal-chakra": kaalChakra,
  "deep-blue-silence": deepBlueSilence,
  "starlight-circus": starlightCircus,
};

export const POSTER_OPTIONS = Object.keys(POSTERS);

export function posterSrc(key: string): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  return POSTERS[key] ?? null;
}
