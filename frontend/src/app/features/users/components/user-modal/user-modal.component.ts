import { Component, OnChanges, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent, SelectOption } from '../../../../shared/components/ui-select/ui-select.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiConfirmDialogComponent } from '../../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Role, User } from '../../../../core/models/user.model';
import { CreateUserPayload, UpdateUserPayload } from '../../services/users-api.service';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiModalComponent,
    UiInputComponent,
    UiSelectComponent,
    UiButtonComponent,
    UiConfirmDialogComponent,
  ],
  template: `
    <app-ui-modal
      [isOpen]="isOpen()"
      variant="slide-over"
      size="md"
      [blocking]="blocking()"
      [closeOnBackdrop]="false"
      [closeOnEscape]="true"
      [title]="userToEdit() ? 'Editar Usuario' : 'Nuevo Usuario'"
      [subtitle]="userToEdit() ? 'Modifica los datos del usuario y administra su estado en la plataforma.' : 'Ingresa la información requerida para dar de alta un nuevo usuario.'"
      (closeModal)="onClose()"
    >
      <form id="userForm" [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-4 pt-2">
        <!-- Full Name Input -->
        <app-ui-input
          label="Nombre Completo"
          [required]="true"
          [maxlength]="255"
          placeholder="Ej: Juan Perez"
          formControlName="fullName"
          [error]="getErrorMessage('fullName')"
        ></app-ui-input>

        <!-- Email Input -->
        <app-ui-input
          label="Correo Electrónico"
          [required]="true"
          [maxlength]="255"
          type="email"
          placeholder="ejemplo@empresa.com"
          formControlName="email"
          [readonly]="!!userToEdit()"
          [hint]="userToEdit() ? 'El correo electrónico es el identificador principal y no se puede modificar.' : ''"
          [error]="getErrorMessage('email')"
        ></app-ui-input>

        <!-- Phone Number Input -->
        <app-ui-input
          label="Teléfono / Celular"
          [maxlength]="50"
          placeholder="+54 9 11 1234 5678"
          formControlName="phoneNumber"
          [error]="getErrorMessage('phoneNumber')"
        ></app-ui-input>

        <!-- Role Select -->
        <app-ui-select
          label="Rol Asignado"
          [required]="true"
          placeholder="Seleccionar rol..."
          formControlName="roleName"
          [options]="roleOptions()"
          [error]="getErrorMessage('roleName')"
        ></app-ui-select>

        @if (userToEdit()) {
          <!-- Edit Mode Administrative Workflow Cards -->
          <div class="pt-6 mt-6 border-t border-zinc-200/80 space-y-4">

            <!-- 1. Estado de Aprobación de Registro -->
            @if (userForm.get('approvalStatus')?.value === 'PENDING') {
              <div class="rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 space-y-3 shadow-xs">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">1.</span>
                      <h4 class="text-sm font-semibold text-zinc-900">Estado de Aprobación de Registro</h4>
                    </div>
                    <p class="text-xs text-zinc-600">
                      Esta solicitud requiere evaluación administrativa previa para acceder al sistema.
                    </p>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300/60">
                    Pendiente
                  </span>
                </div>
                <div class="pt-2 border-t border-amber-200/60 grid grid-cols-2 gap-2">
                  <app-ui-button
                    type="button"
                    variant="primary"
                    size="md"
                    [fullWidth]="true"
                    (clicked)="onOpenApproveConfirm()"
                  >
                    Aprobar Registro
                  </app-ui-button>
                  <app-ui-button
                    type="button"
                    variant="secondary"
                    size="md"
                    [fullWidth]="true"
                    (clicked)="onOpenRejectModal()"
                  >
                    Rechazar Registro
                  </app-ui-button>
                </div>
              </div>
            } @else if (userForm.get('approvalStatus')?.value === 'REJECTED') {
              <div class="rounded-xl border border-rose-200/90 bg-rose-50/40 p-4 space-y-2 shadow-xs">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-bold text-rose-800 uppercase tracking-wider">1.</span>
                      <h4 class="text-sm font-semibold text-zinc-900">Estado de Aprobación de Registro</h4>
                    </div>
                    <p class="text-xs text-zinc-600">
                      Registro denegado por administración. Cuenta inactiva y habilitada para eliminación.
                    </p>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300/60">
                    Rechazado
                  </span>
                </div>
                @if (isSuperAdmin()) {
                  <div class="pt-2 border-t border-rose-200/60 flex justify-end">
                    <app-ui-button
                      type="button"
                      variant="primary"
                      size="sm"
                      (clicked)="onOpenApproveConfirm()"
                    >
                      Reabrir y Aprobar (Superadmin)
                    </app-ui-button>
                  </div>
                }
              </div>
            } @else {
              <!-- APPROVED -->
              <div class="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 space-y-2 shadow-xs">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">1.</span>
                      <h4 class="text-sm font-semibold text-zinc-900">Estado de Aprobación de Registro</h4>
                    </div>
                    <p class="text-xs text-zinc-600">
                      Registro verificado y aprobado. Acceso habilitado con credenciales asignadas.
                    </p>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                    Aprobado
                  </span>
                </div>
                @if (isSuperAdmin()) {
                  <div class="pt-2 border-t border-emerald-200/60 flex justify-end">
                    <app-ui-button
                      type="button"
                      variant="secondary"
                      size="sm"
                      (clicked)="onOpenRejectModal()"
                    >
                      Rechazar Registro (Superadmin)
                    </app-ui-button>
                  </div>
                }
              </div>
            }

            <!-- 2. Estado de Activación de Cuenta -->
            <div class="rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-4 space-y-3 shadow-xs">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-zinc-500 uppercase tracking-wider">2.</span>
                    <h4 class="text-sm font-semibold text-zinc-900">Estado de Activación de Cuenta</h4>
                  </div>
                  <p class="text-xs text-zinc-500">
                    Determina si el usuario tiene acceso activo para iniciar sesión.
                  </p>
                </div>
                @if (userForm.get('isActive')?.value) {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Activo
                  </span>
                } @else {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 text-zinc-700 border border-zinc-300">
                    Inactivo
                  </span>
                }
              </div>
              <div class="pt-2 border-t border-zinc-200/60 space-y-2">
                <app-ui-button
                  type="button"
                  variant="primary"
                  size="md"
                  [fullWidth]="true"
                  [disabled]="!canToggleActive()"
                  (clicked)="onToggleActive()"
                >
                  {{ userForm.get('isActive')?.value ? 'Desactivar Cuenta' : 'Activar Cuenta' }}
                </app-ui-button>
                @if (!canToggleActive()) {
                  <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    La activación o desactivación de la cuenta depende de que el registro esté previamente aprobado.
                  </p>
                }
              </div>
            </div>

            <!-- 3. Eliminar Cuenta de Usuario -->
            @if (canDeleteUserAccount()) {
              <div class="rounded-xl border border-rose-200/90 bg-rose-50/30 p-4 space-y-3 shadow-xs">
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-bold text-rose-700 uppercase tracking-wider">3.</span>
                      <h4 class="text-sm font-semibold text-zinc-900">Eliminar Cuenta de Usuario</h4>
                    </div>
                    @if (isSuperAdmin()) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        Superadmin
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800 border border-rose-200">
                        Habilitado por Rechazo
                      </span>
                    }
                  </div>
                  <p class="text-xs text-zinc-500 leading-relaxed">
                    Esta acción dará de baja lógicamente la cuenta del usuario de la plataforma de inmediato.
                  </p>
                </div>
                <div class="pt-2 border-t border-rose-200/60 flex items-center justify-end">
                  <app-ui-button
                    type="button"
                    variant="danger"
                    size="md"
                    [fullWidth]="true"
                    (clicked)="onOpenDeleteConfirm()"
                  >
                    Eliminar Cuenta de Usuario
                  </app-ui-button>
                </div>
              </div>
            } @else if (isAdmin()) {
              <div class="rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-4 space-y-2 shadow-xs">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider">3.</span>
                      <h4 class="text-sm font-semibold text-zinc-700">Eliminar Cuenta de Usuario</h4>
                    </div>
                    <p class="text-xs text-zinc-500">
                      Los administradores no pueden eliminar cuentas de usuario, excepto aquellas cuyo registro haya sido rechazado.
                    </p>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-zinc-200/80 text-zinc-600 border border-zinc-300/70">
                    Restringido
                  </span>
                </div>
              </div>
            }

          </div>
        }
      </form>

      <!-- Pinned Actions Footer at Bottom of Drawer -->
      <div modal-footer class="w-full">
        <app-ui-button
          type="submit"
          form="userForm"
          variant="primary"
          [fullWidth]="true"
          [disabled]="userForm.invalid || isSubmitting()"
          [loading]="isSubmitting()"
          (clicked)="onSubmit()"
        >
          {{ userToEdit() ? 'Guardar Cambios' : 'Crear Usuario' }}
        </app-ui-button>
      </div>
    </app-ui-modal>

    <!-- Confirmation for Exit / Cancel with Dirty Form -->
    <app-ui-confirm-dialog
      [isOpen]="showCancelConfirm()"
      title="Descartar Cambios"
      message="Tienes cambios no guardados en el formulario. ¿Estás seguro de que deseas salir? Se perderán todos los datos ingresados."
      confirmText="Sí, Salir"
      cancelText="Continuar Editando"
      [isDanger]="false"
      (confirmed)="onConfirmDiscard()"
      (cancelled)="onKeepEditing()"
    ></app-ui-confirm-dialog>

    <!-- Confirmation for Form Submission -->
    <app-ui-confirm-dialog
      [isOpen]="showSubmitConfirm()"
      [title]="userToEdit() ? 'Confirmar Edición de Usuario' : 'Confirmar Creación de Usuario'"
      [message]="userToEdit() ? '¿Estás seguro de que deseas guardar los cambios realizados en la cuenta de ' + (userForm.get('fullName')?.value || 'este usuario') + '?' : '¿Estás seguro de que deseas registrar al usuario ' + (userForm.get('fullName')?.value || '') + ' en la plataforma?'"
      [confirmText]="userToEdit() ? 'Guardar Cambios' : 'Crear Usuario'"
      cancelText="Cancelar"
      [isDanger]="false"
      (confirmed)="onConfirmSave()"
      (cancelled)="onCancelSaveConfirm()"
    ></app-ui-confirm-dialog>

    <!-- Confirmation for User Deletion -->
    <app-ui-confirm-dialog
      [isOpen]="showDeleteConfirm()"
      title="Eliminar Cuenta de Usuario"
      [message]="'¿Estás seguro de que deseas eliminar permanentemente la cuenta de ' + (userForm.get('fullName')?.value || userToEdit()?.email || 'este usuario') + '? Se realizará una baja lógica en el sistema.'"
      confirmText="Eliminar Cuenta"
      cancelText="Cancelar"
      [isDanger]="true"
      (confirmed)="onConfirmDelete()"
      (cancelled)="showDeleteConfirm.set(false)"
    ></app-ui-confirm-dialog>

    <!-- Confirmation for Approval -->
    <app-ui-confirm-dialog
      [isOpen]="showApproveConfirm()"
      title="Aprobar Registro de Usuario"
      [message]="'¿Estás seguro de que deseas aprobar el registro de ' + (userForm.get('fullName')?.value || userToEdit()?.email || 'este usuario') + '? La cuenta se activará automáticamente y se enviará un correo electrónico con su contraseña provisoria para el primer acceso a la plataforma.'"
      confirmText="Aprobar y Activar Cuenta"
      cancelText="Cancelar"
      [isDanger]="false"
      (confirmed)="onConfirmApprove()"
      (cancelled)="showApproveConfirm.set(false)"
    ></app-ui-confirm-dialog>

    <!-- Modal for Rejection Reason -->
    <app-ui-modal
      [isOpen]="showRejectModal()"
      variant="centered"
      size="sm"
      title="Rechazar Registro de Usuario"
      subtitle="Se desactivará la cuenta, se notificará al usuario el motivo y se habilitará la eliminación de la cuenta."
      (closeModal)="onCancelReject()"
    >
      <div class="space-y-4 pt-1">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-700">
            Motivo del Rechazo <span class="text-rose-500">*</span>
          </label>
          <textarea
            [value]="rejectReason()"
            (input)="onRejectReasonInput($event)"
            rows="3"
            placeholder="Describe detalladamente el motivo del rechazo del registro..."
            class="w-full bg-white text-zinc-900 border border-zinc-300 rounded-lg p-3 text-sm placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none font-normal"
          ></textarea>
          @if (rejectReasonError()) {
            <span class="text-xs text-rose-600 font-medium">{{ rejectReasonError() }}</span>
          }
        </div>
      </div>

      <div modal-footer class="flex items-center justify-end gap-2 w-full">
        <app-ui-button
          type="button"
          variant="secondary"
          size="md"
          (clicked)="onCancelReject()"
        >
          Cancelar
        </app-ui-button>
        <app-ui-button
          type="button"
          variant="danger"
          size="md"
          [disabled]="!rejectReason().trim()"
          (clicked)="onConfirmReject()"
        >
          Confirmar Rechazo
        </app-ui-button>
      </div>
    </app-ui-modal>
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
  readonly approveUser = output<number>();
  readonly rejectUser = output<{ id: number; reason: string }>();

  readonly showSubmitConfirm = signal<boolean>(false);
  readonly showCancelConfirm = signal<boolean>(false);
  readonly showDeleteConfirm = signal<boolean>(false);
  readonly showApproveConfirm = signal<boolean>(false);
  readonly showRejectModal = signal<boolean>(false);
  readonly rejectReason = signal<string>('');
  readonly rejectReasonError = signal<string>('');

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
    if (this.isSuperAdmin()) {
      return true;
    }
    const status = this.userForm.get('approvalStatus')?.value;
    return status === 'APPROVED';
  }

  canDeleteUserAccount(): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }
    const status = this.userForm.get('approvalStatus')?.value;
    return status === 'REJECTED' && this.isAdmin();
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
    approvalStatus: ['APPROVED'],
  });

  private initialFormValues: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userToEdit'] || changes['isOpen']) {
      this.showSubmitConfirm.set(false);
      this.showCancelConfirm.set(false);
      this.showDeleteConfirm.set(false);
      this.showApproveConfirm.set(false);
      this.showRejectModal.set(false);
      this.rejectReason.set('');
      this.rejectReasonError.set('');

      const user = this.userToEdit();
      if (user) {
        this.userForm.reset({
          fullName: user.fullName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          roleName: user.roles?.[0]?.name || '',
          isActive: user.isActive ?? true,
          approvalStatus: user.approvalStatus || 'APPROVED',
        });
        if (user.approvalStatus === 'REJECTED') {
          this.userForm.get('roleName')?.disable();
        } else {
          this.userForm.get('roleName')?.enable();
        }
      } else {
        this.userForm.reset({
          fullName: '',
          email: '',
          phoneNumber: '',
          roleName: '',
          isActive: true,
          approvalStatus: 'APPROVED',
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

  onOpenApproveConfirm(): void {
    this.showApproveConfirm.set(true);
  }

  onConfirmApprove(): void {
    this.showApproveConfirm.set(false);
    const user = this.userToEdit();
    if (user) {
      this.approveUser.emit(user.id);
    }
  }

  onOpenRejectModal(): void {
    this.rejectReason.set('');
    this.rejectReasonError.set('');
    this.showRejectModal.set(true);
  }

  onRejectReasonInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.rejectReason.set(target.value);
    if (target.value.trim()) {
      this.rejectReasonError.set('');
    }
  }

  onCancelReject(): void {
    this.showRejectModal.set(false);
    this.rejectReason.set('');
    this.rejectReasonError.set('');
  }

  onConfirmReject(): void {
    const reason = this.rejectReason().trim();
    if (!reason) {
      this.rejectReasonError.set('Debes indicar el motivo del rechazo.');
      return;
    }
    this.showRejectModal.set(false);
    const user = this.userToEdit();
    if (user) {
      this.rejectUser.emit({ id: user.id, reason });
    }
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
      (current.isActive ?? true) !== (this.initialFormValues.isActive ?? true) ||
      (current.approvalStatus ?? 'APPROVED') !== (this.initialFormValues.approvalStatus ?? 'APPROVED')
    );
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
        approvalStatus: (formVal.approvalStatus as any) || undefined,
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
