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
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { OptionItemModel } from '../../cores/models/option-item.model';
import { SortColumn } from '../../cores/models/root.model';
import { OptionItemService } from '../../cores/services/option-item';

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
    ToastModule,
    DialogModule,
    SelectModule,
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
  optionGroup: { label: string | null, value: number | null }[] = [];
  cols!: SortColumn[];
  constructor(
    private optionItemService: OptionItemService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) { }
  //id,itemName,extraprice,optionGroupId,groupName
  private formBuilder = inject(FormBuilder);
  public optionItemForm: FormGroup = this.formBuilder.group({
    id: [0],
    itemName: [''],
    extraPrice: [0],
    optionGroupId: [0],
    groupName: ['']
  });
  ngOnInit(): void {
    this.cols = [
      { field: 'itemName', header: 'Item Name' },
      { field: 'extraPrice', header: 'Extra Price' },
      { field: 'groupName', header: 'Group Name' },
    ]
    this.loadData();
  }
  loadData() {
    this.isLoading = true;
    this.optionItemService.get().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load users.' });
          return;
        }
        const rawItem = Array.isArray(res.data) ? res.data : [];
        this.optionItemModel = rawItem.map((item) => ({
          id: item.id ?? 0,
          itemName: item.itemName ?? '',
          extraPrice: item.extraPrice ?? '',
          optionGroupId: item.optionGroupId ?? 0,
          groupName: item.groupName ?? '',
        }));
        const raw = new Set<Number>();
        this.optionGroup = this.optionItemModel
          .map(gp => ({
            label: gp.groupName,
            value: gp.optionGroupId,
          }))
          .filter(item => {
            if (!item.value || raw.has(item.value)) {
              return false;
            }
            raw.add(item.value);
            return true;
          });
        this.cdr.detectChanges();
        console.log(this.optionItemModel)
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }

    })
  }

  create():void{
    this.modelVisible=true;
    this.isEdited=false;
    this.optionItemForm.reset();
  }
  //id,itemName,extraprice,optionGroupId,groupName
  update(model:OptionItemModel){
    this.modelVisible=true;
    this.isEdited=true;
    this.optionItemForm.reset();
    this.selectedOptionItem=model;
    this.optionItemForm.patchValue({
      id:model.id ?? 0,
      itemName:model.itemName ?? '',
      extraPrice:model.extraPrice ?? '',
      optionGroupId:model.optionGroupId
    })
  }
  edit():void{
    const optionItem=this.optionItemForm.getRawValue();
    let itemData:any;
    if(this.isEdited){
      const currentId = this.selectedOptionItem?.id ?? 0;
      itemData={
        id:currentId,
        itemName:optionItem.itemName,
        extraPrice:Number(optionItem.extraPrice),
        optionGroupId:Number(optionItem.optionGroupId)
      }
      this.optionItemService.update(currentId,itemData).subscribe({
        next: (res) => {
          if (res.success) {
            this.modelVisible = false;
            
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'success',
              detail: 'Category Update Successfully'
            });
          }
          else {
            this.messageService.add({key:'globalMessage', severity: 'error', summary: 'Error', detail: res.message });

          }
        },
        error: (err) => {
          this.modelVisible = false;
          this.loadData();
          this.messageService.add({
            key: 'globalMessage',
            severity: 'warn',
            summary: 'Warning',
            detail: 'Category Update Failed'
          });
        },
        complete: () => { },
      })
    }else{
      itemData={
        id:0,
        itemName:optionItem.itemName,
        extraPrice:Number(optionItem.extraPrice),
        optionGroupId:Number(optionItem.optionGroupId)
      }
      this.optionItemService.create(itemData).subscribe({
         next: (res) => {
          if (res.success) {
            this.modelVisible = false;
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'success',
              detail: 'Category Create Successfully'
            });
          } else {
            this.messageService.add({key:'globalMessage', severity: 'error', summary: 'Error', detail: res.message });
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
            detail: 'Category Create Fail'
          });
        },
        complete: () => { },
      })
    }
  }

  delete(optionItem:OptionItemModel): void {
      this.selectedOptionItem = optionItem;
      this.confirmationService.confirm({
        message: 'Are you sure want to delete?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.optionItemService.delete(optionItem.id).subscribe({
            next: (res) => {
              this.modelVisible = false;
              this.messageService.add({
                key: 'globalMessage',
                severity: 'success',
                summary: 'success',
                detail: 'Category delete Successfully'
              });
            },
            error: (err) => {
              this.modelVisible = false;
              this.messageService.add({
                key: 'globalMessage',
                severity: 'warn',
                summary: 'Warning',
                detail: 'Category delete Failed'
              });
            }
          });
        }
      });
    }
}
