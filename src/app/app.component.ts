import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { gsap } from 'gsap';
import * as THREE from 'three';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'my-3D-portfolio';

  @ViewChild('boxC', { static: false }) boxC!: ElementRef<HTMLImageElement>;
  @ViewChild('boxA', { static: false }) boxA!: ElementRef<HTMLImageElement>;
  @ViewChild('boxB', { static: false }) boxB!: ElementRef<HTMLImageElement>;
  @ViewChild('boxD', { static: false }) boxD!: ElementRef<HTMLImageElement>;
  @ViewChild('boxE', { static: false }) boxE!: ElementRef<HTMLImageElement>;

  @ViewChild('canvasContainer', { static: true }) container!: ElementRef;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  cube!: THREE.Mesh;

    ngOnInit() {
    this.initThree();
    this.animate();
  }

  ngAfterViewInit() {
    gsap.to(this.boxC.nativeElement, {
      rotation: 360,
      repeat: -1,
      ease: "none",
      yoyo: true,
      duration: 6,
    });
    gsap.to(this.boxA.nativeElement, {
      x: 50,
      repeat: -1,
      duration: 4,
      ease: "none",
      yoyo: true
    });
    gsap.to(this.boxD.nativeElement, {
      y: 50,
      repeat: -1,
      duration: 4,
      ease: "none",
      yoyo: true
    });
    gsap.to(this.boxB.nativeElement, {
      x: -70,
      repeat: -1,
      duration: 4,
      ease: "none",
      yoyo: true
    });
    gsap.to(this.boxE.nativeElement, {
      y: -50,
      repeat: -1,
      duration: 4,
      ease: "none",
      yoyo: true
    });
  }

initThree() {

  this.scene = new THREE.Scene();
  this.scene.background = new THREE.Color(0xeeeeee);

  this.camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  this.camera.position.z = 5;

  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  this.renderer.setSize(window.innerWidth, window.innerHeight);
  this.container.nativeElement.appendChild(this.renderer.domElement);

  const geometry = new THREE.BoxGeometry();

  const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    new THREE.MeshBasicMaterial({ color: 0x0000ff }),
    new THREE.MeshBasicMaterial({ color: 0xffff00 }), 
    new THREE.MeshBasicMaterial({ color: 0xff00ff }),
    new THREE.MeshBasicMaterial({ color: 0x00ffff })
  ];

  this.cube = new THREE.Mesh(geometry, materials);
  this.scene.add(this.cube);
}

 animate = () => {
    requestAnimationFrame(this.animate);

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.renderer.render(this.scene, this.camera);
  }

}
