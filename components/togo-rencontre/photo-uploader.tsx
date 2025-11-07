'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { moderateProfilePhotos } from '@/ai/flows/moderate-profile-photos';

interface PhotoUploaderProps {
    initialPhotos?: string[];
    onPhotosChange: (photos: string[]) => void;
}

export function PhotoUploader({ initialPhotos = [], onPhotosChange }: PhotoUploaderProps) {
    const [photos, setPhotos] = useState<string[]>(initialPhotos.slice(0, 6));
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updatePhotos = (newPhotos: string[]) => {
        setPhotos(newPhotos);
        onPhotosChange(newPhotos);
    }

    const handleAddClick = () => {
        if (photos.length >= 6) {
            toast({ variant: 'destructive', title: "Limite atteinte", description: "Vous ne pouvez ajouter que 6 photos." });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const photoDataUri = e.target?.result as string;
            
            setIsUploading(true);
            setProgress(30);

            try {
                toast({ title: "Vérification de la photo...", description: "Votre photo est en cours d'analyse." });
                const moderationResult = await moderateProfilePhotos({ photoDataUri });
                setProgress(70);

                if (moderationResult.isSafe) {
                    const newPhotos = [...photos, photoDataUri];
                    updatePhotos(newPhotos);
                    toast({ title: "Photo ajoutée", description: "Votre photo a été ajoutée avec succès." });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Photo inappropriée",
                        description: moderationResult.reason || "Cette photo ne respecte pas nos consignes et ne peut pas être ajoutée.",
                    });
                }
            } catch (error) {
                console.error("Error during photo moderation:", error);
                toast({
                    variant: "destructive",
                    title: "Erreur de modération",
                    description: "Nous n'avons pas pu vérifier votre photo. Veuillez réessayer.",
                });
            } finally {
                setProgress(100);
                setTimeout(() => {
                    setIsUploading(false);
                    setProgress(0);
                }, 500);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = (photoToRemove: string) => {
        const newPhotos = photos.filter(p => p !== photoToRemove);
        updatePhotos(newPhotos);
    };

    return (
        <div className="space-y-4 pt-2">
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
                className="hidden"
            />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {photos.map((photo, index) => (
                    <Card key={index} className="group relative aspect-[3/4] overflow-hidden">
                        <Image src={photo} alt={`Photo de profil ${index + 1}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="destructive" size="icon" onClick={() => handleRemovePhoto(photo)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        {index === 0 && (
                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                                PROFIL
                            </div>
                        )}
                    </Card>
                ))}

                {photos.length < 6 && (
                    <Card
                        className="aspect-[3/4] flex items-center justify-center border-2 border-dashed cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                        onClick={!isUploading ? handleAddClick : undefined}
                    >
                        <div className="text-center text-muted-foreground">
                            <PlusCircle className="h-8 w-8 mx-auto" />
                            <p className="mt-2 text-sm">Ajouter</p>
                        </div>
                    </Card>
                )}
            </div>
            {isUploading && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Téléchargement et vérification en cours...</p>
                    <Progress value={progress} className="w-full" />
                </div>
            )}
        </div>
    );
}
