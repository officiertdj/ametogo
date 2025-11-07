'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Heart,
  MessageSquare,
  User as UserIcon,
  LogOut,
  Gift,
  Moon,
  Sun,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Logo } from '../logo';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Match } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { useTheme } from 'next-themes';

const navItems = [
  { href: '/decouvrir', label: 'Découvrir', icon: Compass },
  {
    href: '/matchs',
    label: 'Matchs',
    icon: Heart,
    notificationKey: 'matches',
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: MessageSquare,
    notificationKey: 'messages',
  },
  { href: '/parametres', label: 'Faire un don', icon: Gift },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { setTheme } = useTheme();

  // --- Notifications Logic ---
  const pendingMatchesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'matches'),
      where('status', '==', 'pending'),
      where('userIds', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: pendingMatches } = useCollection<Match>(pendingMatchesQuery);

  const notificationCounts = {
    matches: pendingMatches?.filter(m => m.userIds[1] === user?.uid).length || 0,
    messages: 0, // Mocked for now
  };
  // --- End Notifications Logic ---

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Déconnexion',
        description: 'Vous avez été déconnecté avec succès.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de se déconnecter. Veuillez réessayer.',
      });
    }
  };

  if (!user) return null;

  const userAvatarUrl = user?.photoURL;

  const renderNavItem = (item: (typeof navItems)[0], isMobile = false) => {
    const isActive = pathname.startsWith(item.href);
    const count = item.notificationKey
      ? notificationCounts[item.notificationKey as keyof typeof notificationCounts]
      : 0;

    if (isMobile) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'relative flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors w-1/5',
            pathname === item.href ||
              (item.href !== '/decouvrir' && pathname.startsWith(item.href))
              ? 'text-primary'
              : 'text-muted-foreground hover:text-primary'
          )}
        >
          {count > 0 && (
            <Badge className="absolute top-1 right-1 h-5 w-5 justify-center p-0">
              {count}
            </Badge>
          )}
          <item.icon className="h-6 w-6" />
          <span className="text-xs font-medium">{item.label}</span>
        </Link>
      );
    }

    return (
      <Button
        key={item.href}
        asChild
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start text-base py-6 relative"
      >
        <Link href={item.href}>
          <item.icon className="mr-3 h-5 w-5" />
          {item.label}
          {count > 0 && <Badge className="absolute right-4">{count}</Badge>}
        </Link>
      </Button>
    );
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card text-card-foreground">
        <div className="p-6 border-b flex items-center gap-2">
          <Link href="/decouvrir" className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary font-headline">
              AméTogo
            </h1>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => renderNavItem(item))}
        </nav>
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    {userAvatarUrl && (
                      <AvatarImage
                        src={userAvatarUrl}
                        alt={user.displayName || 'User'}
                      />
                    )}
                    <AvatarFallback>
                      {user.displayName
                        ? user.displayName.charAt(0).toUpperCase()
                        : user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-sm">
                      {user.displayName || user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Voir le profil
                    </span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 mb-2"
              side="top"
              align="start"
            >
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profil">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Thème</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Clair
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Sombre
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content & Mobile View */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between px-4 h-16 border-b sticky top-0 bg-background z-20">
          <Link href="/decouvrir" className="flex items-center gap-2">
            <Logo className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold text-primary font-headline">
              AméTogo
            </h1>
          </Link>
          <Link href="/profil">
            <Avatar>
              {userAvatarUrl && (
                <AvatarImage
                  src={userAvatarUrl}
                  alt={user.displayName || 'User'}
                />
              )}
              <AvatarFallback>
                {user.displayName
                  ? user.displayName.charAt(0).toUpperCase()
                  : user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </header>

        <main className="flex-1 bg-muted/30 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-20">
          <nav className="flex justify-around items-center h-16">
            {[
              ...navItems,
              { href: '/profil', label: 'Profil', icon: UserIcon },
            ].map(item => renderNavItem(item, true))}
          </nav>
        </footer>
      </div>
    </div>
  );
}
