import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { UserProfile } from '@/lib/types';
import { MapPin } from 'lucide-react';

interface ProfileCardProps {
  profile: UserProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const coverImage = profile.profilePictureUrls[0];

  return (
    <Link href={`/profils/${profile.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="aspect-[3/4] relative">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={`Photo de ${profile.name}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full bg-secondary"></div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
              <h3 className="font-bold text-lg text-white truncate">{profile.name}, {profile.age}</h3>
              <div className="flex items-center gap-1 text-xs text-neutral-300">
                <MapPin className="w-3 h-3"/>
                <span>{profile.city}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
