import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface InspirationImage {
  id: number;
  url: string;
  category: string;
  title: string;
  heightClass: string;
}

@Component({
  selector: 'app-inspiration-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inspiration-gallery.html',
  styleUrls: ['./inspiration-gallery.css']
})
export class InspirationGalleryComponent {
  categories = ['All', 'Venues', 'Floral', 'Attire', 'Decor'];
  selectedCategory = 'All';

  // Mock data for the masonry gallery
  images: InspirationImage[] = [
    { id: 1, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=500&q=80', category: 'Venues', title: 'Rustic Barn', heightClass: 'tall' },
    { id: 2, url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=500&q=80', category: 'Decor', title: 'Elegant Table Setup', heightClass: 'short' },
    { id: 3, url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=500&q=80', category: 'Floral', title: 'Bridal Bouquet', heightClass: 'medium' },
    { id: 4, url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=500&q=80', category: 'Venues', title: 'Outdoor Ceremony', heightClass: 'medium' },
    { id: 5, url: 'https://images.unsplash.com/photo-1546193430-c2d207739ed7?auto=format&fit=crop&w=500&q=80', category: 'Attire', title: 'Classic Wedding Gown', heightClass: 'tall' },
    { id: 6, url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=80', category: 'Attire', title: 'Boho Dress', heightClass: 'short' },
    { id: 7, url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=500&q=80', category: 'Floral', title: 'Centerpieces', heightClass: 'medium' },
    { id: 8, url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=500&q=80', category: 'Decor', title: 'Lighting Details', heightClass: 'tall' },
    { id: 9, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=500&q=80', category: 'Venues', title: 'Beach Wedding', heightClass: 'short' }
  ];

  get filteredImages() {
    if (this.selectedCategory === 'All') {
      return this.images;
    }
    return this.images.filter(img => img.category === this.selectedCategory);
  }

  setCategory(cat: string) {
    this.selectedCategory = cat;
  }
}
