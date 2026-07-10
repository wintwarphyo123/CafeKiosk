import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MenuDetailResponseDto, OptionGroupDto, RequestMenuOptionGroupDto } from '../../cores/models/menu-detail.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MenuService } from '../../cores/services/menu';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { ImageModule } from 'primeng/image';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-menu-detail',
  imports: [
    CommonModule, FormsModule, ToastModule, ReactiveFormsModule, ButtonModule,
    InputIconModule, IconFieldModule, TableModule, ConfirmDialogModule,
    InputTextModule, DialogModule, SelectModule, ImageModule, MultiSelectModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './menu-detail.html',
  styleUrl: './menu-detail.scss',
})
export class MenuDetail implements OnInit {
  menuId!: number;
  selectedMenu: MenuDetailResponseDto | null = null;
  selectedGroupIds: number[] = [];
  activePanels: OptionGroupDto[] = [];
  allOptionGroupsList: OptionGroupDto[] = []; 
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private menuService: MenuService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.menuId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.menuId) {
      this.loadMasterOptionGroups();
    }
  }

  loadMasterOptionGroups() {
    this.isLoading = true;
    this.menuService.getAllOptionGroups().subscribe({
      next: (res: any) => {
        this.allOptionGroupsList = res?.data ? res.data : (Array.isArray(res) ? res : []);
        this.cdr.detectChanges();
        this.loadMenuDetailFromApi();
      },
      error: (err) => {
        console.error('Master Option Groups Error:', err);
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMenuDetailFromApi() {
    this.menuService.getMenudetail(this.menuId).subscribe({
      next: (res: any) => {
        this.isLoading=false;
        console.log('📦 API Response:', res);

        if (res && res.success && res.data) {
          
          this.selectedMenu = res.data;

          if (res.data.optionGroups && res.data.optionGroups.length > 0) {
            this.selectedGroupIds = res.data.optionGroups.map((g: any) => Number(g.groupId));
          } else {
            this.selectedGroupIds = [];
          }
          this.updateActivePanels();
        } else {

          console.warn(` Menu Id: ${this.menuId} `);
          this.clearUiStates();
        }
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(' Menu Detail API Error:', err);
        this.messageService.add({ 
          key: 'globalMessage', 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load menu detail' 
        });
        this.clearUiStates();
        this.cdr.detectChanges();
        this.isLoading = false;
      }
    });
  }

  onOptionGroupChange(event: any) {
    this.updateActivePanels();
  }

  updateActivePanels() {
    if (!this.selectedGroupIds || this.selectedGroupIds.length === 0 || !this.allOptionGroupsList) {
      this.activePanels = [];
      return;
    }
    const numericTargetIds = this.selectedGroupIds.map(id => Number(id));
    // this.activePanels = this.allOptionGroupsList.filter(group => 
    //   group && numericTargetIds.includes(Number(group.groupId))
    // );
    this.activePanels = JSON.parse(JSON.stringify(
      this.allOptionGroupsList.filter(group => group && numericTargetIds.includes(Number(group.groupId)))
    ));

    if (this.selectedMenu?.optionGroups) {
      this.activePanels.forEach(panel => {
        const matchingApiResponseGroup = this.selectedMenu?.optionGroups?.find(g => Number(g.groupId) === Number(panel.groupId));
        if (matchingApiResponseGroup && panel.optionItems) {
          panel.optionItems.forEach(item => {
            const apiItemMatch = matchingApiResponseGroup.optionItems?.find(oi => Number(oi.itemId) === Number(item.itemId));
            if (apiItemMatch) {
              // Ensure backend values map smoothly to frontend model variables
              item.isAvailable = apiItemMatch.isAvailable !== false;
            } else {
              item.isAvailable = true;
            }
          });
        } else if (panel.optionItems) {
          // If it's a completely new panel just attached by the dropdown selection list, default items to true
          panel.optionItems.forEach(item => item.isAvailable = true);
        }
      });
    }
  }

  removePanel(groupId: number) {
    this.selectedGroupIds = this.selectedGroupIds.filter(id => Number(id) !== Number(groupId));
    this.updateActivePanels();
  }

  saveMenuOptions() {
    const postDto: RequestMenuOptionGroupDto = {
      menuId: this.menuId,
      optionGroupIds: this.selectedGroupIds.map(id => Number(id))
    };
    const optionsAvailabilityPayload = this.activePanels.flatMap(panel => 
      (panel.optionItems || []).map(item => ({
        optionItemId: item.itemId,
        isAvailable: item.isAvailable !== false
      }))
    );
    const unifiedSavePayload = {
      ...postDto,
      optionsAvailability: optionsAvailabilityPayload
    };
    this.menuService.linkOptionGroup(unifiedSavePayload).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ key: 'globalMessage', severity: 'success', summary: 'Success', detail: 'Specifications saved successfully!' });
          setTimeout(() => this.goBack(), 1000); 
        }
      },
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Save Error', detail: err.error?.message || 'Failed to save' });
      }
    });
  }

  clearUiStates() {
    this.selectedMenu = null;
    this.selectedGroupIds = [];
    this.activePanels = [];
  }

  goBack() {
    if (this.router.url.includes('/staff')) {
      this.router.navigate(['/staff/menu']);
    } else {
      this.router.navigate(['/admin/menu']);
    }
  }
}