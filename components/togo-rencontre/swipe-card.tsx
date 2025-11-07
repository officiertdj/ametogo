'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { UserProfile } from '@/lib/types';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpring, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

interface SwipeCardProps {
  profile: UserProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  isActive: boolean;
}

export function SwipeCard({ profile, onSwipe, isActive }: SwipeCardProps) {
  const coverImage = profile.profilePictureUrls[0];

  // Animation logic from react-spring and use-gesture
  const [{ x, rot, scale }, api] = useSpring(() => ({
    x: 0,
    rot: 0,
    scale: 1,
    config: { friction: 50, tension: 500 },
  }));

  const bind = useGesture({
    onDrag: ({ active, down, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      if (!isActive) return;
      
      const trigger = vx > 0.2; // Velocity threshold
      const dir = xDir < 0 ? -1 : 1; // Direction

      if (!active && trigger) {
        // If the drag is released and velocity is high enough, trigger swipe
        const direction = dir === 1 ? 'right' : 'left';
        onSwipe(direction);
      }

      api.start({
        x: active ? mx : 0,
        rot: mx / 10 + (active ? dir * 10 * vx : 0),
        scale: active ? 1.05 : 1,
        immediate: (n) => active && n === 'x',
      });
    },
     onDragEnd: ({ movement: [mx] }) => {
        if (!isActive) return;
        // If dropped past a certain threshold, swipe
        if (Math.abs(mx) > window.innerWidth / 3) {
           onSwipe(mx > 0 ? 'right' : 'left');
        } else {
          // Otherwise, spring back to center
          api.start({ x: 0, rot: 0, scale: 1 });
        }
    },
  });

  return (
    <animated.div
      {...bind()}
      style={{ x, rotate: rot, scale }}
      className={cn(
        "absolute w-full h-full max-w-sm rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out cursor-grab active:cursor-grabbing",
        isActive ? "z-10" : "z-0 scale-95"
      )}
    >
      <div className="absolute inset-0">
          {coverImage ? (
              <Image
                src={coverImage}
                alt={`Photo de ${profile.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={isActive}
              />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <animated.div 
            style={{ 
                opacity: x.to(x => Math.abs(x) / (window.innerWidth / 4)),
                borderColor: x.to(x => x > 0 ? 'hsl(var(--match))' : 'hsl(var(--primary))')
            }}
            className="absolute top-8 left-8 text-4xl font-bold text-white border-4 rounded-xl px-4 py-2 pointer-events-none -rotate-12"
          >
              {x.to(x => x > 0 ? 'MATCH' : 'PASS')}
          </animated.div>

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <Link href={`/profils/${profile.id}`} onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-3xl text-shadow">{profile.name}, {profile.age}</h3>
            </Link>
            <div className="flex items-center gap-2 text-md text-neutral-200 text-shadow-sm">
              <MapPin className="w-5 h-5"/>
              <span>{profile.city}</span>
            </div>
            <p className="mt-2 text-neutral-200 line-clamp-2">{profile.bio}</p>
          </div>
      </div>
    </animated.div>
  );
}
