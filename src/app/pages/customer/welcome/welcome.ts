import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class Welcome {
  constructor(private router: Router) {}

  startOrdering(): void {
    this.router.navigate(['/customer_menu']);
  }
}
