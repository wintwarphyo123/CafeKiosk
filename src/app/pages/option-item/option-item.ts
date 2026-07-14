import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { ImageModule } from 'primeng/image';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select'; // 💡 Menu အတိုင်း SelectModule ကိုပဲ သုံးထားပါတယ်
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { OptionItemModel } from '../../cores/models/option-item.model';
import { SortColumn } from '../../cores/models/root.model';
import { OptionItemService } from '../../cores/services/option-item';
import { OptionGroupService } from '../../cores/services/option-group';

@Component({
  selector: 'app-option-item',
  imports: [
    FormsModule,
    ToastModule,
    ReactiveFormsModule,
    ButtonModule,
    InputIconModule,
    IconFieldModule,
    TableModule,
    ConfirmDialogModule,
    InputTextModule,
    DialogModule,
    SelectModule, // 💡 Menu အတိုင်း တပုံစံတည်း SelectModule ပါပဲ
    ImageModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './option-item.html',
  styleUrl: './option-item.scss',
})
export class OptionItem implements OnInit {

  optionItemModel: OptionItemModel[] = [];
  isLoading: boolean = false;
  modelVisible: boolean = false;
  isEdited: boolean = false;
  selectedOptionItem: OptionItemModel | null = null;
  dropDownOptions: any[] = [];
  cols!: SortColumn[];
  selectedState:string='Active';
  filterItemModel:OptionItemModel[]=[];
  constructor(
    private optionItemService: OptionItemService,
    private optionGroupService: OptionGroupService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) { }

  private formBuilder = inject(FormBuilder);
  public optionItemForm: FormGroup = this.formBuilder.group({
    id: [0],
    itemName: [''],
    extraPrice: [0],
    optionGroupId: [0], // 💡 FIX: Menu အတိုင်း default ကို 0 ပဲ ပေးထားပါမယ်
    groupName: ['']
  });

  ngOnInit(): void {
    this.cols = [
      { field: 'itemName', header: 'Item Name' },
      { field: 'extraPrice', header: 'Extra Price' },
      { field: 'groupName', header: 'Group Name' },
    ];
    this.loadOptionGroups();
  }

  loadOptionGroups() {
    this.isLoading = true;
    this.optionGroupService.get().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          const rawGroups = Array.isArray(res.data) ? res.data : [];
          
          this.dropDownOptions = rawGroups.map((gp) => ({
            id: gp.id || gp.optionGroupId || 0,
            name: gp.name || gp.groupName || 'Unknown Group'
          }));
          
          console.log('Successfully loaded groups:', this.dropDownOptions);
        } else {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load option groups.' });
        }
        this.cdr.detectChanges();
        this.loadData(); 
      },
      error: (err) => {
        this.isLoading = false;
        this.loadData(); 
        this.cdr.detectChanges();
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Failed to fetch option groups from server.' });
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.optionItemService.get().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          const rawItem = Array.isArray(res.data) ? res.data : [];
          this.optionItemModel = rawItem.map((item) => ({
            id: item.id ?? 0,
            itemName: item.itemName ?? '',
            extraPrice: item.extraPrice ?? 0,
            optionGroupId: item.optionGroupId ?? 0, // 💡 FIX: Menu component ရဲ့ categoryId ကဲ့သို့ default ကို 0 ပေးလိုက်ပါတယ်
            groupName: item.groupName ?? '',
            status:item.status?? ''
          }));
        } else {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load items.' });
        }
        this.filterItemState(this.selectedState);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Failed to fetch data from server.' });
      }
    });
  }
  changeState(state: string): void {
        this.selectedState = state;
        this.filterItemState(state);
      }
filterItemState(state: string) {
        if (state === 'Active') {
          this.filterItemModel = this.optionItemModel.filter(item => item.status === true);
        }
        else if (state === 'Deleted') {
          this.optionItemService.getDeletedData().subscribe({
            next: (res) => {
              this.isLoading = false;
              if (res.success) {
                this.filterItemModel=res.data;
              }
              this.cdr.detectChanges();
            }
          })
        }
        else {
          this.filterItemModel = [...this.optionItemModel];
        }
      }
      restoreItem(item:OptionItemModel) {
       
        this.confirmationService.confirm({
          message: 'Are you sure want to restore?',
          header: 'Confirmation',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            this.optionItemService.restoreData(item.id).subscribe({
              next: (res) => {
                this.modelVisible = false;
                if (res.success) {
                  this.loadData();
                  this.messageService.add({
                    key: 'globalMessage',
                    severity: 'success',
                    summary: 'success',
                    detail: 'option group restore successfully'
                  });
                  this.filterItemState('Deleted');
                } else {
                  this.messageService.add({
                    key: 'globalMessage',
                    severity: 'warn',
                    summary: 'warning',
                    detail: 'option group restore fail'
                  });
                  this.cdr.detectChanges();
                }
              },
              error: (err) => {
                
                this.modelVisible = false;
                this.loadData();
                this.messageService.add({
                  key: 'globalMessage',
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Option Group restore failed, name is already exist!!'
                });
                this.cdr.detectChanges();
              }
            });
          }
        })
      }

  create(): void {
    this.isEdited = false;
    this.selectedOptionItem = null;
    this.optionItemForm.reset({
      id: 0,
      itemName: '',
      extraPrice: 0,
      optionGroupId: 0, // 💡 Default 0
      groupName: ''
    });
    this.modelVisible = true;
  }

  update(model: OptionItemModel) {
    this.optionItemForm.reset();
    this.isEdited = true;
    this.selectedOptionItem = model;
    
    this.optionItemForm.patchValue({
      id: model.id ?? 0,
      itemName: model.itemName ?? '',
      extraPrice: model.extraPrice ?? 0,
      optionGroupId: model.optionGroupId ?? 0 // 💡 Default 0
    });
    this.modelVisible = true;
    this.cdr.detectChanges();
  }

  edit(): void {
    const optionItem = this.optionItemForm.getRawValue();
    let itemData: any;
    
    if (this.isEdited) {
      const currentId = this.selectedOptionItem?.id ?? 0;
      itemData = {
        id: currentId,
        itemName: optionItem.itemName,
        extraPrice: Number(optionItem.extraPrice),
        optionGroupId: Number(optionItem.optionGroupId)
      };
      this.optionItemService.update(currentId, itemData).subscribe({
        next: (res) => {
          if (res.success) {
            this.modelVisible = false;
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'Success',
              detail: 'Option Item Updated Successfully'
            });
          } else {
            this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message });
          }
        },
        error: (err) => {
          this.modelVisible = false;
          this.loadData();
          this.messageService.add({
            key: 'globalMessage',
            severity: 'warn',
            summary: 'Warning',
            detail: 'Option Item Update Failed'
          });
        }
      });
    } else {
      itemData = {
        id: 0,
        itemName: optionItem.itemName,
        extraPrice: Number(optionItem.extraPrice),
        optionGroupId: Number(optionItem.optionGroupId)
      };
      this.optionItemService.create(itemData).subscribe({
        next: (res) => {
          if (res.success) {
            this.modelVisible = false;
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'Success',
              detail: 'Option Item Created Successfully'
            });
          } else {
            this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.modelVisible = false;
          this.loadData();
          this.messageService.add({
            key: 'globalMessage',
            severity: 'warn',
            summary: 'Warning',
            detail: 'Option Item Create Failed'
          });
        }
      });
    }
  }

  delete(optionItem: OptionItemModel): void {
    this.selectedOptionItem = optionItem;
    this.confirmationService.confirm({
      message: 'Are you sure want to delete?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.optionItemService.delete(optionItem.id).subscribe({
          next: (res) => {
            this.loadData();
            this.modelVisible = false;
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'Success',
              detail: 'Option Item Deleted Successfully'
            });
          },
          error: (err) => {
            this.modelVisible = false;
            this.messageService.add({
              key: 'globalMessage',
              severity: 'warn',
              summary: 'Warning',
              detail: 'Option Item Delete Failed'
            });
          }
        });
      }
    });
  }
}