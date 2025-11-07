'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { reportInappropriateContent, ReportInappropriateContentInput } from '@/ai/flows/report-inappropriate-content';
import { ShieldAlert } from "lucide-react";

const reportSchema = z.object({
  reason: z.string().min(10, { message: "Veuillez fournir une raison d'au moins 10 caractères." }).max(500),
});

interface ReportDialogProps {
    profileId: string;
    reportedContent: string;
    contentType: 'photo' | 'bio';
}

export function ReportDialog({ profileId, reportedContent, contentType }: ReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof reportSchema>>({
        resolver: zodResolver(reportSchema),
        defaultValues: { reason: "" },
    });

    async function handleReport(values: z.infer<typeof reportSchema>) {
        setIsSubmitting(true);
        try {
            const input: ReportInappropriateContentInput = {
                profileId,
                reporterId: 'current_user_id_mock', // This would be the actual user ID
                reportedContent,
                contentType,
                reportReason: values.reason,
            };

            const result = await reportInappropriateContent(input);

            console.log("Moderation result:", result);
            toast({
                title: "Signalement envoyé",
                description: "Merci, notre équipe va examiner ce profil.",
            });
            setOpen(false);
            form.reset();

        } catch (error) {
            console.error("Failed to report content:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Le signalement n'a pas pu être envoyé. Veuillez réessayer.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Signaler le profil">
                    <ShieldAlert className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Signaler le profil</DialogTitle>
                    <DialogDescription>
                        Aidez-nous à garder AméTogo sûr. Décrivez pourquoi vous signalez ce profil.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleReport)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Raison du signalement</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ex: La photo de profil est inappropriée, le texte de la bio est offensant..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Annuler</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Envoi..." : "Envoyer le signalement"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
