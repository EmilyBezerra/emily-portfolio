import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-manifesto',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './manifesto.html',
  styleUrl: './manifesto.scss'
})
export class Manifesto {}
