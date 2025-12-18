import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I18nService } from 'src/app/core/services/i18n.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  readonly i18n = inject(I18nService);
}
