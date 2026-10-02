import { Component, OnChanges, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../../core/services/auth.service';
import { Role, User } from '../../../../core/models/user.model';
import { CreateUserPayload, UpdateUserPayload } from '../../services/users-api.service';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DrawerModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    DialogModule,
    TagModule,
  ],
  template: `
    <p-drawer
      [visible]="isOpen()"
      (visibleChange)="onDrawerVisibleChange($event)"
      position="right"
      [modal]="true"
      [dismissible]="false"
      [closeOnEscape]="!hasFormChanges()"
      [closable]="false"
      styleClass="!w-full sm:!w-[520px] lg:!w-[560px] !max-w-[95vw] !p-0"
    >
      <!-- Header -->
      <ng-template #header>
        <div class="flex items-start justify-between w-full">
          <div class="space-y-0.5">
            <h3 class="text-base font-semibold text-zinc-900 leading-tight">
              {{ userToEdit() ? 'Editar Usuario' : 'Nuevo Usuario' }}
            </h3>
            <p class="text-xs text-zinc-500 font-normal">
              {{ userToEdit() ? 'Modifica los datos del usuario y administra su estado en la plataforma.' : 'Ingresa la información requerida para dar de alta un nuevo usuario.' }}
            </p>
          </div>
          <p-button
            icon="pi pi-times"
            severity="secondary"
            variant="text"
            [rounded]="true"
            size="small"
            (onClick)="onClose()"
            aria-label="Cerrar drawer"
          />
        </div>
      </ng-template>

      <!-- Form Content -->
      <form id="userForm" [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-4 p-1">
        <!-- Full Name Input -->
        <div class="space-y-1.5">
          <label for="fullName" class="block text-xs font-semibold text-zinc-700">
            Nombre Completo <span class="text-rose-500">*</span>
          </label>
          <input
            pInputText
            id="fullName"
            formControlName="fullName"
            maxlength="255"
            placeholder="Ej: Juan Perez"
            class="w-full text-sm"
            [class.ng-invalid]="isFieldInvalid('fullName')"
            [class.ng-dirty]="isFieldInvalid('fullName')"
          />
          @if (isFieldInvalid('fullName')) {
            <small class="text-rose-500 text-xs font-medium block">{{ getErrorMessage('fullName') }}</small>
          }
        </div>

        <!-- Email Input -->
        <div class="space-y-1.5">
          <label for="email" class="block text-xs font-semibold text-zinc-700">
            Correo Electrónico <span class="text-rose-500">*</span>
          </label>
          <input
            pInputText
            id="email"
            type="email"
            formControlName="email"
            maxlength="255"
            placeholder="ejemplo@empresa.com"
            [readonly]="!!userToEdit()"
            class="w-full text-sm"
            [class.ng-invalid]="isFieldInvalid('email')"
            [class.ng-dirty]="isFieldInvalid('email')"
          />
          @if (userToEdit()) {
            <span class="text-[11px] text-zinc-500 block">El correo electrónico es el identificador principal y no se puede modificar.</span>
          }
          @if (isFieldInvalid('email')) {
            <small class="text-rose-500 text-xs font-medium block">{{ getErrorMessage('email') }}</small>
          }
        </div>

        <!-- Phone Number Input (Optional) -->
        <div class="space-y-1.5">
          <label for="phoneNumber" class="block text-xs font-semibold text-zinc-700">
            Teléfono / Celular <span class="text-xs text-zinc-400 font-normal">(Opcional)</span>
          </label>
          <input
            pInputText
            id="phoneNumber"
            formControlName="phoneNumber"
            maxlength="50"
            placeholder="+54 9 11 1234 5678"
            class="w-full text-sm"
            [class.ng-invalid]="isFieldInvalid('phoneNumber')"
            [class.ng-dirty]="isFieldInvalid('phoneNumber')"
          />
          @if (isFieldInvalid('phoneNumber')) {
            <small class="text-rose-500 text-xs font-medium block">{{ getErrorMessage('phoneNumber') }}</small>
          }
        </div>

        <!-- Role Select -->
        <div class="space-y-1.5">
          <label for="roleName" class="block text-xs font-semibold text-zinc-700">
            Rol Asignado <span class="text-rose-500">*</span>
          </label>
          <p-select
            id="roleName"
            formControlName="roleName"
            [options]="roleOptions()"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar rol..."
            [fluid]="true"
            class="w-full text-sm"
            [class.ng-invalid]="isFieldInvalid('roleName')"
            [class.ng-dirty]="isFieldInvalid('roleName')"
          />
          @if (isFieldInvalid('roleName')) {
            <small class="text-rose-500 text-xs font-medium block">{{ getErrorMessage('roleName') }}</small>
          }
        </div>

        @if (userToEdit()) {
          <!-- Edit Mode Administrative Actions -->
          <div class="pt-6 mt-6 border-t border-zinc-200/80 space-y-4">

            <!-- 1. Estado de Activación de Cuenta -->
            <div class="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3.5 shadow-xs">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <h4 class="text-sm font-semibold text-zinc-900">Estado de Activación de Cuenta</h4>
                  <p class="text-xs text-zinc-500">
                    Determina si el usuario tiene acceso activo para iniciar sesión.
                  </p>
                </div>
                <p-tag
                  [severity]="userForm.get('isActive')?.value ? 'contrast' : 'secondary'"
                  [value]="userForm.get('isActive')?.value ? 'Activo' : 'Inactivo'"
                  class="text-xs font-medium"
                />
              </div>
              <div class="pt-3 border-t border-zinc-200/80">
                <p-button
                  type="button"
                  [severity]="userForm.get('isActive')?.value ? 'secondary' : 'contrast'"
                  [variant]="userForm.get('isActive')?.value ? 'outlined' : undefined"
                  [fluid]="true"
                  [disabled]="!canToggleActive()"
                  (onClick)="onToggleActive()"
                  [icon]="userForm.get('isActive')?.value ? 'pi pi-ban' : 'pi pi-check-circle'"
                  [label]="userForm.get('isActive')?.value ? 'Desactivar Cuenta' : 'Activar Cuenta'"
                />
              </div>
            </div>

            <!-- 2. Eliminar Cuenta de Usuario (Zona de Peligro) -->
            @if (canDeleteUserAccount()) {
              <div class="rounded-xl border-2 border-rose-200 bg-rose-50/50 p-4 space-y-3.5 transition-colors">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                    <i class="pi pi-exclamation-triangle text-rose-600 text-sm"></i>
                  </div>
                  <div class="space-y-1">
                    <h4 class="text-sm font-semibold text-rose-950">Zona de Peligro: Eliminar Cuenta</h4>
                    <p class="text-xs text-rose-800/80 leading-relaxed">
                      Esta acción dará de baja lógicamente la cuenta del usuario de la plataforma de inmediato. El usuario perderá acceso al sistema.
                    </p>
                  </div>
                </div>
                <div class="pt-3 border-t border-rose-200/80">
                  <p-button
                    type="button"
                    severity="danger"
                    [fluid]="true"
                    (onClick)="onOpenDeleteConfirm()"
                    icon="pi pi-trash"
                    label="Eliminar Cuenta de Usuario"
                  />
                </div>
              </div>
            }

          </div>
        }
      </form>

      <!-- Pinned Actions Footer at Bottom of Drawer -->
      <ng-template #footer>
        <div class="w-full">
          <p-button
            type="submit"
            form="userForm"
            severity="contrast"
            [fluid]="true"
            [disabled]="userForm.invalid || isSubmitting()"
            [loading]="isSubmitting()"
            [label]="userToEdit() ? 'Guardar Cambios' : 'Crear Usuario'"
            (onClick)="onSubmit()"
          />
        </div>
      </ng-template>
    </p-drawer>

    <!-- Confirmation for Exit / Cancel with Dirty Form (PrimeNG Dialog) -->
    <p-dialog
      header="Descartar Cambios"
      [visible]="showCancelConfirm()"
      (visibleChange)="showCancelConfirm.set($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', maxWidth: '440px' }"
    >
      <p class="text-sm text-zinc-600 leading-relaxed py-2">
        Tienes cambios no guardados en el formulario. ¿Estás seguro de que deseas salir? Se perderán todos los datos ingresados.
      </p>
      <ng-template #footer>
        <div class="flex items-center justify-end gap-2 pt-2">
          <p-button
            label="Continuar Editando"
            severity="secondary"
            variant="outlined"
            (onClick)="onKeepEditing()"
          />
          <p-button
            label="Sí, Salir"
            severity="contrast"
            (onClick)="onConfirmDiscard()"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Confirmation for Form Submission (PrimeNG Dialog) -->
    <p-dialog
      [header]="userToEdit() ? 'Confirmar Edición de Usuario' : 'Confirmar Creación de Usuario'"
      [visible]="showSubmitConfirm()"
      (visibleChange)="showSubmitConfirm.set($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', maxWidth: '440px' }"
    >
      <p class="text-sm text-zinc-600 leading-relaxed py-2">
        {{ userToEdit() ? '¿Estás seguro de que deseas guardar los cambios realizados en la cuenta de ' + (userForm.get('fullName')?.value || 'este usuario') + '?' : '¿Estás seguro de que deseas registrar al usuario ' + (userForm.get('fullName')?.value || '') + ' en la plataforma?' }}
      </p>
      <ng-template #footer>
        <div class="flex items-center justify-end gap-2 pt-2">
          <p-button
            label="Cancelar"
            severity="secondary"
            variant="outlined"
            (onClick)="onCancelSaveConfirm()"
          />
          <p-button
            [label]="userToEdit() ? 'Guardar Cambios' : 'Crear Usuario'"
            severity="contrast"
            (onClick)="onConfirmSave()"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Confirmation for User Deletion (PrimeNG Dialog) -->
    <p-dialog
      header="Eliminar Cuenta de Usuario"
      [visible]="showDeleteConfirm()"
      (visibleChange)="showDeleteConfirm.set($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', maxWidth: '440px' }"
    >
      <p class="text-sm text-zinc-600 leading-relaxed py-2">
        ¿Estás seguro de que deseas eliminar permanentemente la cuenta de <strong>{{ userForm.get('fullName')?.value || userToEdit()?.email || 'este usuario' }}</strong>? Se realizará una baja lógica en el sistema.
      </p>
      <ng-template #footer>
        <div class="flex items-center justify-end gap-2 pt-2">
          <p-button
            label="Cancelar"
            severity="secondary"
            variant="outlined"
            (onClick)="showDeleteConfirm.set(false)"
          />
          <p-button
            label="Eliminar Cuenta"
            severity="danger"
            (onClick)="onConfirmDelete()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class UserModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isOpen = input<boolean>(false);
  readonly userToEdit = input<User | null>(null);
  readonly availableRoles = input<Role[]>([]);
  readonly isSubmitting = input<boolean>(false);
  readonly closeOnBackdrop = input<boolean>(false);
  readonly blocking = input<boolean>(false);

  readonly closeModal = output<void>();
  readonly saveUser = output<{ isEdit: boolean; id?: number; payload: CreateUserPayload | UpdateUserPayload }>();
  readonly deleteUser = output<User>();

  readonly showSubmitConfirm = signal<boolean>(false);
  readonly showCancelConfirm = signal<boolean>(false);
  readonly showDeleteConfirm = signal<boolean>(false);

  readonly isSuperAdmin = computed(() =>
    (this.authService.currentUser()?.roles || []).some((r) => r.name?.toUpperCase() === 'SUPERADMIN'),
  );

  readonly isAdmin = computed(() =>
    (this.authService.currentUser()?.roles || []).some((r) => {
      const name = r.name?.toUpperCase();
      return name === 'ADMIN' || name === 'SUPERADMIN';
    }),
  );

  canToggleActive(): boolean {
    return this.isAdmin();
  }

  canDeleteUserAccount(): boolean {
    if (!this.isAdmin()) return false;
    const currentUserId = this.authService.currentUser()?.id;
    const targetUser = this.userToEdit();
    if (currentUserId && targetUser && currentUserId === targetUser.id) {
      return false;
    }
    if (!this.isSuperAdmin() && (targetUser?.roles || []).some((r) => r.name?.toUpperCase() === 'SUPERADMIN')) {
      return false;
    }
    return true;
  }

  readonly userForm = this.fb.group({
    fullName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(255),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.maxLength(255), Validators.email]],
    phoneNumber: ['', [Validators.maxLength(50), Validators.pattern(/^\+?[0-9\s\-()]{6,50}$/)]],
    roleName: ['', [Validators.required]],
    isActive: [true],
  });

  private initialFormValues: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userToEdit'] || changes['isOpen']) {
      this.showSubmitConfirm.set(false);
      this.showCancelConfirm.set(false);
      this.showDeleteConfirm.set(false);

      const user = this.userToEdit();
      if (user) {
        this.userForm.reset({
          fullName: user.fullName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          roleName: user.roles?.[0]?.name || '',
          isActive: user.isActive ?? true,
        });
        this.userForm.get('roleName')?.enable();
      } else {
        this.userForm.reset({
          fullName: '',
          email: '',
          phoneNumber: '',
          roleName: '',
          isActive: true,
        });
        this.userForm.get('roleName')?.enable();
      }
      this.initialFormValues = this.userForm.getRawValue();
    }
  }

  roleOptions(): SelectOption[] {
    return (this.availableRoles() || []).map((r) => ({
      label: `${r.name}${r.description ? ' - ' + r.description : ''}`,
      value: r.name,
    }));
  }

  isFieldInvalid(field: string): boolean {
    const control = this.userForm.get(field);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getErrorMessage(field: string): string {
    const control = this.userForm.get(field);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['email']) return 'Formato de correo electrónico inválido.';
    if (control.errors['minlength']) {
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres.`;
    }
    if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
    }
    if (control.errors['pattern']) {
      if (field === 'fullName') return 'El nombre solo debe contener letras y espacios.';
      if (field === 'phoneNumber') return 'Formato de teléfono inválido (ej: +54 9 11 1234 5678).';
    }
    return 'Campo inválido.';
  }

  onToggleActive(): void {
    if (!this.canToggleActive()) return;
    const current = this.userForm.get('isActive')?.value;
    this.userForm.get('isActive')?.setValue(!current);
    this.userForm.get('isActive')?.markAsDirty();
  }

  hasFormChanges(): boolean {
    if (!this.userForm.dirty) {
      return false;
    }
    if (!this.initialFormValues) {
      return this.userForm.dirty;
    }
    const current = this.userForm.getRawValue();
    return (
      (current.fullName ?? '') !== (this.initialFormValues.fullName ?? '') ||
      (current.email ?? '') !== (this.initialFormValues.email ?? '') ||
      (current.phoneNumber ?? '') !== (this.initialFormValues.phoneNumber ?? '') ||
      (current.roleName ?? '') !== (this.initialFormValues.roleName ?? '') ||
      (current.isActive ?? true) !== (this.initialFormValues.isActive ?? true)
    );
  }

  onDrawerVisibleChange(visible: boolean): void {
    if (!visible) {
      this.onClose();
    }
  }

  onClose(): void {
    if (this.hasFormChanges()) {
      this.showCancelConfirm.set(true);
    } else {
      this.forceClose();
    }
  }

  onConfirmDiscard(): void {
    this.showCancelConfirm.set(false);
    this.forceClose();
  }

  onKeepEditing(): void {
    this.showCancelConfirm.set(false);
  }

  private forceClose(): void {
    this.userForm.reset();
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.showSubmitConfirm.set(true);
  }

  onConfirmSave(): void {
    this.showSubmitConfirm.set(false);
    this.executeSave();
  }

  onCancelSaveConfirm(): void {
    this.showSubmitConfirm.set(false);
  }

  private executeSave(): void {
    const formVal = this.userForm.getRawValue();
    const user = this.userToEdit();

    if (user) {
      const payload: UpdateUserPayload = {
        fullName: formVal.fullName || undefined,
        email: formVal.email || undefined,
        phoneNumber: formVal.phoneNumber || undefined,
        roles: formVal.roleName ? [formVal.roleName] : undefined,
        isActive: formVal.isActive ?? true,
      };
      this.saveUser.emit({ isEdit: true, id: user.id, payload });
    } else {
      const payload: CreateUserPayload = {
        fullName: formVal.fullName!,
        email: formVal.email!,
        phoneNumber: formVal.phoneNumber || undefined,
        roles: formVal.roleName ? [formVal.roleName] : ['USER'],
      };
      this.saveUser.emit({ isEdit: false, payload });
    }
  }

  onOpenDeleteConfirm(): void {
    this.showDeleteConfirm.set(true);
  }

  onConfirmDelete(): void {
    this.showDeleteConfirm.set(false);
    const user = this.userToEdit();
    if (user) {
      this.deleteUser.emit(user);
    }
  }
}
