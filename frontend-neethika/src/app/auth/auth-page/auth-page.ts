import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginForm } from '../login-form/login-form';
import { RegisterForm } from '../register-form/register-form';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, LoginForm, RegisterForm],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.css',
})
export class AuthPage {
  activeTab: Tab = 'login';
  isDarkMode = false;
  setTab(tab: Tab) {
    this.activeTab = tab;
  
  }
    toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
}}