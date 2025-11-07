import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react';

export default function DonPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faire un don</h1>
        <p className="text-muted-foreground">Soutenez le développement et la maintenance de l'application.</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-transparent to-transparent">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 text-primary p-3 rounded-full">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Soutenir AméTogo</CardTitle>
              <CardDescription>Votre contribution aide à maintenir l'application gratuite pour tous.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            AméTogo est un projet passionné qui a pour but de rester gratuit. Si vous appréciez l'application et souhaitez soutenir les coûts de maintenance et les futurs développements, chaque contribution, même la plus modeste, est précieuse.
          </p>
          <div className="bg-card border p-4 rounded-lg space-y-4">
            <div>
                <h3 className="font-semibold mb-2">Comment faire un don ?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                Envoyez votre don par T-Money/Flooz ou Moov Money aux numéros suivants.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/10 border-2 border-dashed border-primary/50 text-center py-4 rounded-md">
                    <p className="text-sm font-semibold text-primary/80">T-Money / Flooz</p>
                    <p className="font-mono text-xl md:text-2xl font-bold tracking-widest text-primary">+228 7145 0651</p>
                </div>
                <div className="bg-green-500/10 border-2 border-dashed border-green-500/50 text-center py-4 rounded-md">
                     <p className="text-sm font-semibold text-green-600/80">Moov Money</p>
                    <p className="font-mono text-xl md:text-2xl font-bold tracking-widest text-green-600">+228 7984 5879</p>
                </div>
            </div>
             <p className="text-xs text-muted-foreground pt-2">
              Merci d'inclure votre nom suivi de la mention <span className="font-semibold">"Don pour AméTogo"</span> dans la référence de la transaction.
            </p>
          </div>
          <p className="text-center text-sm font-semibold pt-4">
            Un grand merci pour votre soutien ! — Mixx By Yas
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
