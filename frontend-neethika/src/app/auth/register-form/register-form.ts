import { Component,Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-form.html',
  styleUrl: './register-form.css',
})
export class RegisterForm {

  form: any;
  submitted = false;
@Output() goToLogin = new EventEmitter<void>();
  constructor(private fb: FormBuilder) {

    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agree: [false, [Validators.requiredTrue]],
    });

  }
  switchToLogin() {
  this.goToLogin.emit();
}

  submit() {
    this.submitted = true;

    if (this.form.invalid) return;

    console.log(this.form.value);
  }

  get f() {
    return this.form.controls;
  }
}