import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CustomDialog from "@/components/dialogs/customDialog";
import CreateUserDialog from "@/components/dialogs/settings/createUserDialog";
import GeneratedPasswordDialog from "@/components/dialogs/settings/generatedPasswordDialog";
import { getApiErrorMessage, listUsers, regeneratePassword, type CreatedUserResult, type UserDto } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/components/use-auth";

const UsersSettingsSection = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [generatedPasswordResult, setGeneratedPasswordResult] = useState<CreatedUserResult | null>(null);
    const [userPendingRegeneration, setUserPendingRegeneration] = useState<UserDto | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const loadUsers = async () => {
        setIsLoading(true);

        try {
            setUsers(await listUsers());
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare gli utenti"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            void loadUsers();
        });
    }, []);

    const handleUserCreated = (result: CreatedUserResult) => {
        setUsers((prev) => [...prev, result.user].sort((a, b) => a.username.localeCompare(b.username)));
        setGeneratedPasswordResult(result);
        toast.success("Utente creato con successo");
    };

    const handleConfirmRegenerate = async () => {
        if (!userPendingRegeneration || isRegenerating) {
            return;
        }

        try {
            setIsRegenerating(true);
            const result = await regeneratePassword(userPendingRegeneration.id);
            setUserPendingRegeneration(null);
            setGeneratedPasswordResult(result);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile rigenerare la password"));
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <Card size="sm" className="border-primary/15 shadow-sm">
            <CardHeader className="flex-row items-start justify-between gap-2 border-b border-primary/10 bg-muted/20">
                <div>
                    <CardTitle>Utenti</CardTitle>
                    <CardDescription>Gestisci gli account che possono accedere all'applicazione.</CardDescription>
                </div>
                <Button type="button" onClick={() => setIsCreateOpen(true)}>
                    <UserPlus className="size-4" />
                    Nuovo utente
                </Button>
            </CardHeader>
            <CardContent className="pt-4">
                {isLoading ? (
                    <div className="rounded-md border border-dashed border-primary/20 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                        Caricamento utenti...
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome utente</TableHead>
                                <TableHead>Creato il</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.username}
                                        {user.id === currentUser?.id ? (
                                            <span className="ml-2 text-xs text-muted-foreground">(tu)</span>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setUserPendingRegeneration(user)}
                                        >
                                            <KeyRound className="size-4" />
                                            Rigenera password
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreated={handleUserCreated} />

            <CustomDialog
                open={userPendingRegeneration != null}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setUserPendingRegeneration(null);
                    }
                }}
                title="Rigenera password"
                description={
                    userPendingRegeneration
                        ? `Verrà generata una nuova password casuale per "${userPendingRegeneration.username}". La password attuale smetterà di funzionare.`
                        : undefined
                }
                confirmLabel={isRegenerating ? "Rigenerazione..." : "Rigenera"}
                cancelLabel="Annulla"
                onCancel={() => setUserPendingRegeneration(null)}
                onConfirm={() => void handleConfirmRegenerate()}
                cancelDisabled={isRegenerating}
                confirmDisabled={isRegenerating}
            />

            {generatedPasswordResult ? (
                <GeneratedPasswordDialog
                    open
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) {
                            setGeneratedPasswordResult(null);
                        }
                    }}
                    username={generatedPasswordResult.user.username}
                    password={generatedPasswordResult.generatedPassword}
                />
            ) : null}
        </Card>
    );
};

export default UsersSettingsSection;
