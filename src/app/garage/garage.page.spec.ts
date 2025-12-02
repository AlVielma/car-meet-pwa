import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GaragePage } from './garage.page';

describe('GaragePage', () => {
  let component: GaragePage;
  let fixture: ComponentFixture<GaragePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GaragePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
