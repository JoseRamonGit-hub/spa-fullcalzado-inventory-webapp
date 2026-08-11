import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableError } from "@/components/ui/data-table-error";
import { useBusinesses } from "@/features/business/hooks/useBusinessQueries";
import type { Business, ManagedUser } from "@/types";
import { columns } from "./columns";
import { Topbar } from "./components/topbar";
import { UserFormModal } from "./components/user-form-modal";
import { useCreateUser, useUpdateUser } from "./hooks/useUserMutations";
import { useManagedUsers } from "./hooks/useUserQueries";
import { getUserRoleLabel } from "./utils/user-labels";

function getBusinessNames(user: ManagedUser, businesses: Business[]) {
  if (user.role === "admin" && user.business_ids.length === 0) {
    return "todos los negocios";
  }

  return user.business_ids
    .map((businessId) => businesses.find((business) => business.id === businessId)?.name ?? "")
    .join(" ");
}

function filterUsers(users: ManagedUser[], businesses: Business[], search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return users;

  return users.filter((user) => {
    const statusLabel = user.is_active !== false ? "activo" : "inactivo";

    return (
      user.fullname.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term) ||
      getUserRoleLabel(user.role).toLowerCase().includes(term) ||
      statusLabel.startsWith(term) ||
      getBusinessNames(user, businesses).toLowerCase().includes(term)
    );
  });
}

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const usersQuery = useManagedUsers();
  const businessesQuery = useBusinesses();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const businesses = businessesQuery.data ?? [];
  const filteredUsers = filterUsers(usersQuery.data ?? [], businesses, search);
  const isLoading = usersQuery.isLoading || businessesQuery.isLoading;
  const isBlockingError =
    (usersQuery.isError && !usersQuery.data) || (businessesQuery.isError && !businessesQuery.data);
  const isSaving = createUser.isPending || updateUser.isPending;

  const openCreateModal = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar
        search={search}
        totalUsers={usersQuery.data?.length ?? 0}
        onSearchChange={setSearch}
        onCreateUser={openCreateModal}
      />

      {isLoading ? (
        <DataTable
          columns={columns}
          data={[]}
          isLoading
          emptyMessage=""
          tableClassName="min-w-[64rem]"
          scrollAreaLabel="Usuarios"
        />
      ) : isBlockingError ? (
        <DataTableError
          title="No pudimos cargar los usuarios"
          onRetry={() => Promise.all([usersQuery.refetch(), businessesQuery.refetch()])}
          isRetrying={usersQuery.isFetching || businessesQuery.isFetching}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          emptyMessage={
            search.trim() ? "No se encontraron usuarios que coincidan con la búsqueda." : "No hay usuarios registrados."
          }
          onRowClick={openEditModal}
          getRowAriaLabel={(user) => `Editar usuario ${user.fullname}`}
          meta={{ businesses, onEdit: openEditModal }}
          getRowId={(row) => row.id}
          tableClassName="min-w-[64rem]"
          scrollAreaLabel="Usuarios"
        />
      )}

      {isFormOpen ? (
        <UserFormModal
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          user={editingUser}
          businesses={businesses}
          onCreate={createUser.mutateAsync}
          onUpdate={updateUser.mutateAsync}
          isPending={isSaving}
        />
      ) : null}
    </section>
  );
}
