"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "SUPERVISEUR" | "ADMINISTRATEUR" ;
};

interface UserFormProps {
  user?: User;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
  password: z
    .string()
    .min(8, {
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    })
    .optional()
    .or(z.literal("")),
  role: z.enum(["CLIENT", "SUPERVISEUR", "ADMINISTRATEUR"], {
    required_error: "Veuillez sélectionner un rôle.",
  }),
});

export function UserForm({ user }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!user;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "CLIENT",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const endpoint = isEditing
        ? `/api/admin/users/${user.id}`
        : "/api/admin/users";
      const method = isEditing ? "PUT" : "POST";

      // Si nous sommes en mode édition et que le mot de passe est vide, ne pas l'envoyer
      const dataToSend =
        isEditing && !values.password
          ? { name: values.name, email: values.email, role: values.role }
          : values;

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue.");
      }

      toast({
        variant: "success",
        title: isEditing ? "Utilisateur mis à jour" : "Utilisateur créé",
        description: isEditing
          ? "Les informations de l'utilisateur ont été mises à jour avec succès."
          : "Le nouvel utilisateur a été créé avec succès.",
      });

      router.push("/dashboard/admin/users");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 w-fit">
          <Link href="/dashboard/admin/users">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à la liste des utilisateurs
          </Link>
        </Button>
        <CardTitle>
          {isEditing ? "Modifier l'utilisateur" : "Créer un nouvel utilisateur"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifiez les informations de l'utilisateur. Laissez le champ mot de passe vide pour le conserver."
            : "Remplissez ce formulaire pour créer un nouvel utilisateur."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing
                      ? "Nouveau mot de passe (optionnel)"
                      : "Mot de passe"}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  {isEditing && (
                    <FormDescription>
                      Laissez vide pour conserver le mot de passe actuel.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CLIENT">Client</SelectItem>
                      <SelectItem value="SUPERVISEUR">Superviseur</SelectItem>
                      <SelectItem value="ADMINISTRATEUR">
                        Administrateur
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Mise à jour en cours..."
                  : "Création en cours..."
                : isEditing
                ? "Mettre à jour"
                : "Créer l'utilisateur"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
