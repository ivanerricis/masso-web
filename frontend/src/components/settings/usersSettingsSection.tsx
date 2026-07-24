import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, Trash2, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CustomDialog from "@/components/dialogs/customDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import CreateUserDialog from "@/components/dialogs/settings/createUserDialog";
import GeneratedPasswordDialog from "@/components/dialogs/settings/generatedPasswordDialog";
import {
    deleteUser,
    disableUser,
    enableUser,
    getApiErrorMessage,
    listUsers,
    regeneratePassword,
    type CreatedUserResult,
    type UserDto,
} from "@/lib/api";
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
    const [userPendingDisable, setUserPendingDisable] = useState<UserDto | null>(null);
    const [isTogglingActive, setIsTogglingActive] = useState(false);
    const [userPendingDelete, setUserPendingDelete] = useState<UserDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleConfirmDisable = async () => {
        if (!userPendingDisable || isTogglingActive) {
            return;
        }

        try {
            setIsTogglingActive(true);
            const updated = await disableUser(userPendingDisable.id);
            setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
            setUserPendingDisable(null);
            toast.success(`Account "${updated.username}" disabilitato`);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile disabilitare l'account"));
        } finally {
            setIsTogglingActive(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!userPendingDelete || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteUser(userPendingDelete.id);
            setUsers((prev) => prev.filter((user) => user.id !== userPendingDelete.id));
            toast.success(`Utente "${userPendingDelete.username}" eliminato`);
            setUserPendingDelete(null);
        } catch (error) {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Impossibile eliminare l'account: disabilitalo se è ancora in uso altrove"
                )
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEnable = async (user: UserDto) => {
        if (isTogglingActive) {
            return;
        }

        try {
            setIsTogglingActive(true);
            const updated = await enableUser(user.id);
            setUsers((prev) => prev.map((existing) => (existing.id === updated.id ? updated : existing)));
            toast.success(`Account "${updated.username}" riabilitato`);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile riabilitare l'account"));
        } finally {
            setIsTogglingActive(false);
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
                                        {user.isAdmin ? (
                                            <span className="ml-2 text-xs text-muted-foreground">(admin)</span>
                                        ) : null}
                                        {!user.active ? (
                                            <span className="ml-2 text-xs text-destructive">(disabilitato)</span>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setUserPendingRegeneration(user)}
                                            >
                                                <KeyRound className="size-4" />
                                                Rigenera password
                                            </Button>
                                            {user.id !== currentUser?.id ? (
                                                <>
                                                    {user.active ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setUserPendingDisable(user)}
                                                        >
                                                            <UserX className="size-4" />
                                                            Disabilita
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isTogglingActive}
                                                            onClick={() => void handleEnable(user)}
                                                        >
                                                            <ShieldCheck className="size-4" />
                                                            Riabilita
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setUserPendingDelete(user)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Elimina
                                                    </Button>
                                                </>
                                            ) : null}
                                        </div>
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

            <CustomDialog
                open={userPendingDisable != null}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setUserPendingDisable(null);
                    }
                }}
                title="Disabilita account"
                description={
                    userPendingDisable
                        ? `L'utente "${userPendingDisable.username}" non potrà più accedere all'applicazione finché non verrà riabilitato. Le sessioni aperte verranno terminate.`
                        : undefined
                }
                destructive
                confirmLabel={isTogglingActive ? "Disabilitazione..." : "Disabilita"}
                cancelLabel="Annulla"
                onCancel={() => setUserPendingDisable(null)}
                onConfirm={() => void handleConfirmDisable()}
                cancelDisabled={isTogglingActive}
                confirmDisabled={isTogglingActive}
            />

            <ConfirmDeleteDialog
                open={userPendingDelete != null}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setUserPendingDelete(null);
                    }
                }}
                title="Elimina utente"
                description={
                    userPendingDelete
                        ? `L'account "${userPendingDelete.username}" verrà eliminato definitivamente. Se è ancora collegato a qualcosa nell'applicazione, disabilitalo invece di eliminarlo.`
                        : ""
                }
                isDeleting={isDeleting}
                onConfirm={handleConfirmDelete}
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
