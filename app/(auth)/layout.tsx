import Link from 'next/link';
import Image from 'next/image';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgImage = getPlaceholderImage('landing-bg');

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-black">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          priority
          className="object-cover"
          style={{ filter: 'blur(4px) brightness(0.6)' }}
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mx-auto mb-8 text-center">
            <Logo className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-white font-headline">AméTogo</h1>
        </Link>
        <div className='mb-4 text-center text-white'>Rencontrons-nous ici</div>
        {children}
      </div>
    </div>
  );
}
