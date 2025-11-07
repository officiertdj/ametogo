import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  const bgImage = getPlaceholderImage("landing-bg");

  if (!bgImage) {
    return null; // Or a fallback UI
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
      <Image
        src={bgImage.imageUrl}
        alt={bgImage.description}
        fill
        priority
        className="object-cover scale-110"
        style={{ filter: 'blur(8px) brightness(0.7)' }}
        data-ai-hint={bgImage.imageHint}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center p-4">
        <div className="flex items-center gap-4">
          <Logo className="h-16 w-16 text-primary" />
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter text-shadow animate-fade-in-down">
            AméTogo
          </h1>
        </div>
        <p className="max-w-md text-lg text-neutral-200 animate-fade-in-up">
          Rencontrons-nous ici
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mt-4">
          <Button asChild size="lg" className="w-full text-lg py-6">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full text-lg py-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link href="/signup">Créer un compte</Link>
          </Button>
        </div>
      </div>
      <p className="absolute bottom-6 text-sm text-neutral-400 z-10">
        Vous devez avoir 18 ans ou plus.
      </p>
    </main>
  );
}
