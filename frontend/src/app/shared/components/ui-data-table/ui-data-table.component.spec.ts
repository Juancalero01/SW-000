import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { UiDataTableComponent } from './ui-data-table.component';

@Component({
  standalone: true,
  imports: [UiDataTableComponent],
  template: `
    <app-ui-data-table
      [loading]="loading()"
      [page]="page()"
      [pageSize]="pageSize()"
      [totalPages]="totalPages()"
      [totalItems]="totalItems()"
      (pageChange)="onPageChange($event)"
      (pageSizeChange)="onPageSizeChange($event)"
    >
      <ng-container table-headers>
        <th>ID</th>
        <th>Nombre</th>
      </ng-container>
      <ng-container table-rows>
        <tr>
          <td>1</td>
          <td>Juan Perez</td>
        </tr>
      </ng-container>
    </app-ui-data-table>
  `,
})
class TestHostComponent {
  loading = signal<boolean>(false);
  page = signal<number>(1);
  pageSize = signal<number>(10);
  totalPages = signal<number>(3);
  totalItems = signal<number>(25);

  lastEmittedPage: number | null = null;
  lastEmittedPageSize: number | null = null;

  onPageChange(newPage: number): void {
    this.lastEmittedPage = newPage;
  }

  onPageSizeChange(newSize: number): void {
    this.lastEmittedPageSize = newSize;
  }
}

describe('UiDataTableComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render headers, rows, and pagination bar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('ID');
    expect(compiled.textContent).toContain('Juan Perez');
    expect(compiled.textContent).toContain('Mostrando 1 a 10 de 25 resultados');
  });

  it('should emit pageChange when page number button is clicked', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const page2Btn = buttons.find((b) => b.textContent?.trim() === '2');

    page2Btn?.click();
    fixture.detectChanges();

    expect(host.lastEmittedPage).toBe(2);
  });

  it('should calculate item range summary correctly', () => {
    host.page.set(2);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mostrando 11 a 20 de 25 resultados');
  });

  it('should hide pagination bar when totalPages is 1', () => {
    host.totalPages.set(1);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Mostrando');
  });
});
