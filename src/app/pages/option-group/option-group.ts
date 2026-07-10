import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { OptionGroupModel } from '../../cores/models/option-group.model';
import { OptionGroupService } from '../../cores/services/option-group';
import { SortColumn } from '../../cores/models/root.model';

@Component({
  selector: 'app-option-group',
  imports: [
    CommonModule,
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
    SelectModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './option-group.html',
  styleUrl: './option-group.scss',
})
export class OptionGroup implements OnInit {
  optionGroupModel: OptionGroupModel[]=[];
  modelVisible:boolean=false;
  isLoading:boolean=false;
  isEdited:boolean=false;
  selectedGroup:OptionGroupModel| null=null;
  cols!:SortColumn[];

  constructor(
    private optionGroupService:OptionGroupService,
    private messageService:MessageService,
    private cdr:ChangeDetectorRef,
    private confirmationService:ConfirmationService
  ){}

  private formBuilder=inject(FormBuilder);
  public optionGroupForm:FormGroup=this.formBuilder.group({
    id:[0],
    groupName:[''],
    status:[true]
  });

  ngOnInit(): void {
    this.cols=[
      {field:'groupName',header:'Option Group Name'}
      
    ]
   this.loadData();
  }
  loadData() {
    this.isLoading=true;
    this.optionGroupService.get().subscribe({
      next:(res)=>{
        if(res.success){
          this.optionGroupModel=res.data;
        }else {
          this.messageService.add({key:'globalMessage', severity: 'error', summary: 'Error', detail: res.message });
        }
        this.isLoading = false;
        console.log(this.optionGroupModel);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  create():void{
    this.optionGroupForm.reset();
    this.modelVisible=true;
    this.isEdited=false;
  }

  update(optionGroup:OptionGroupModel):void{
    this.optionGroupForm.reset();
    this.modelVisible=true;
    this.isEdited=true;
    this.selectedGroup=optionGroup;
    this.optionGroupForm.patchValue({
      id:optionGroup.id,
      groupName:optionGroup.groupName,
      status:optionGroup.status
    });
  }

  edit():void{
    if(this.isEdited){
      const model:OptionGroupModel={
        id:this.optionGroupForm.controls['id'].value ?? 0,
        groupName:this.optionGroupForm.controls['groupName'].value ?? '',
        status:this.optionGroupForm.controls['status'].value ?? ''
      };
      this.optionGroupService.update(model.id,model).subscribe({
        next: (res) => {
          if (res.success) {
            this.modelVisible = false;
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'success',
              detail: 'option Group Update Successfully'
            });
          } else {
            this.messageService.add({ key:'globalMessage',severity: 'error', summary: 'Error', detail: res.message });
          }
        },
        error: (err) => {
          this.modelVisible = false;
          this.loadData();
          this.messageService.add({
            key: 'globalMessage',
            severity: 'warn',
            summary: 'Warning',
            detail: 'option Group Update Failed'
          });
        },
        complete: () => { },
      });
    }
    else{
      this.optionGroupService.create(this.optionGroupForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.modelVisible = false;
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'success',
              detail: 'option Group create Successfully'
            });
          } else {
            this.messageService.add({ key:'globalMessage',severity: 'error', summary: 'Error', detail: res.message });
          }
        },
        error: (err) => {
          this.modelVisible = false;
          this.loadData();
          this.messageService.add({
            key: 'globalMessage',
            severity: 'warn',
            summary: 'Warning',
            detail: 'option Group create Failed'
          });
        },
        complete: () => { },
      });
    }
  }
  delete(group:OptionGroupModel):void{
    this.selectedGroup=group;
    this.confirmationService.confirm({
      message: 'Are you sure want to delete?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.optionGroupService.delete(group.id).subscribe({
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

  changeStatus(optionGroup:OptionGroupModel): void {
     this.isLoading=true;
      this.optionGroupService.changeStatus(optionGroup.id).subscribe({
        next: (res) => {
          this.isLoading=false;
          if (res.success) {
            optionGroup.status=!optionGroup.status;
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'success',
              detail: 'option group status updated successfully'
            });
          } else {
            this.messageService.add({ key:'globalMessage',severity: 'error', summary: 'Error', detail: res.message });
          }
        },
        error: (err) => {
          this.isLoading=false;
          this.messageService.add({
            key: 'globalMessage',
            severity: 'warn',
            summary: 'Warning',
            detail: 'option group status update failed'
          });
        }
      }); 
    }

}
