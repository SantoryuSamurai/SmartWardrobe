"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PlusCircle, MessageCircle, Search, X, Heart, Edit2, Trash2, ImagePlus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
interface Section {
  id: number;
  name: string;
  items: number[];
}

interface WardrobeItem {
  id: number;
  name: string;
  type: string;
  color: string;
  style: string;
  location: string;
  imageUrl: string;
  tags: string[];
  category: string;
}

const SmartWardrobe = () => {
  // Sections State
  const [sections, setSections] = useState<Section[]>([
    { id: 1, name: 'Drawer 1', items: [1, 2] },
    { id: 2, name: 'Drawer 2', items: [3, 4] },
    { id: 3, name: 'Closet', items: [5, 6] },
  ]);

  // Wardrobe State
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState('all-items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New Item State
  const [newItem, setNewItem] = useState({
    name: '',
    type: '',
    color: '',
    style: '',
    category: '',
    location: '',
    tags: [] as string[]
  });

  // Categories
  const categories = [
    { id: 'all-items', name: 'All Items' },
    { id: 'workwear', name: 'Work Wear' },
    { id: 'partywear', name: 'Party Wear' },
    { id: 'casual', name: 'Casual' },
    { id: 'favorites', name: 'Favorites' }
  ];

  // Fetch wardrobe items on component mount
  useEffect(() => {
    fetchWardrobeItems();
  }, []);

  // Fetch Wardrobe Items from Supabase
  const fetchWardrobeItems = async () => {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*');

      if (error) {
        toast({
          title: "Fetch Failed",
          description: "Could not load wardrobe items.",
          variant: "destructive"
        });
        return;
      }

      setWardrobe(data || []);
    } catch (error) {
      console.error('Fetching wardrobe items error:', error);
    }
  };

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload image to Supabase storage
  const uploadImageToSupabase = async () => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `wardrobe/${fileName}`;

      const { data, error } = await supabase.storage
        .from('wardrobe-images')
        .upload(filePath, imageFile);

      if (error) {
        toast({
          title: "Upload Failed",
          description: "Could not upload image.",
          variant: "destructive"
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  // Handle complete item addition
  const handleAddItem = async () => {
    setIsUploading(true);

    try {
      // Upload image first
      const imageUrl = await uploadImageToSupabase();

      // Prepare item for database
      const newWardrobeItem = {
        ...newItem,
        imageUrl: imageUrl || "/api/placeholder/400/320",
        tags: newItem.tags
      };

      // Add to Supabase
      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert(newWardrobeItem)
        .select();

      if (error) {
        toast({
          title: "Item Addition Failed",
          description: "Could not add item to wardrobe.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setWardrobe([...wardrobe, data[0]]);

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Item addition error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setNewItem({
      name: '',
      type: '',
      color: '',
      style: '',
      category: '',
      location: '',
      tags: []
    });
    setImageFile(null);
    setImagePreview(null);
    setShowUploadModal(false);
  };

  // Utility Functions
  const getItemCountInSection = (sectionName: string) => {
    return wardrobe.filter(item => item.location === sectionName).length;
  };

  const toggleFavorite = async (itemId: number) => {
    const item = wardrobe.find(i => i.id === itemId);
    if (!item) return;

    const newTags = item.tags.includes('favorite')
      ? item.tags.filter(tag => tag !== 'favorite')
      : [...item.tags, 'favorite'];

    try {
      const { error } = await supabase
        .from('wardrobe_items')
        .update({ tags: newTags })
        .eq('id', itemId);

      if (error) {
        toast({
          title: "Update Failed",
          description: "Could not update favorite status.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setWardrobe(wardrobe.map(i => 
        i.id === itemId ? { ...i, tags: newTags } : i
      ));
    } catch (error) {
      console.error('Toggling favorite error:', error);
    }
  };

  const handleStyleAssistantClick = () => {
    window.open('https://cdn.botpress.cloud/webchat/v2.2/shareable.html?configUrl=https://files.bpcontent.cloud/2024/11/19/03/20241119030807-4TNHTARG.json', '_blank');
  };

  // Filtering Logic
  const filteredItems = wardrobe.filter(item => {
    let tabFilter = true;
    
    if (activeTab === 'favorites') {
      tabFilter = item.tags.includes('favorite');
    } else if (activeTab === 'all-items') {
      tabFilter = selectedSection ? item.location === selectedSection.name : true;
    } else {
      tabFilter = item.category === activeTab;
    }

    const searchFilter = 
      !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase());

    return tabFilter && searchFilter;
  });

  // Section Manager Component
  const SectionManager = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {sections.map((section) => (
        <Card 
          key={section.id}
          className={`cursor-pointer hover:shadow-md transition-shadow
            ${selectedSection?.id === section.id ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedSection(selectedSection?.id === section.id ? null : section)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{section.name}</h3>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {getItemCountInSection(section.name) === 0 
                ? 'Empty' 
                : `${getItemCountInSection(section.name)} ${
                    getItemCountInSection(section.name) === 1 ? 'item' : 'items'
                  }`
              }
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Upload Modal Component
  const UploadModal = () => (
    <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Wardrobe Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image Upload Section */}
          <div 
            className={`border-2 ${
              imagePreview 
                ? 'border-solid border-green-500' 
                : 'border-dashed border-gray-300'
            } rounded-lg p-4 text-center relative`}
          >
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48">
                <ImagePlus className="w-12 h-12 mb-2 text-gray-400" />
                <p className="text-gray-500">No image selected</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleImageSelect}
            />
          </div>

          {/* Detailed Item Input Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input 
              placeholder="Item Name" 
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            />
            <Input 
              placeholder="Type (e.g., T-Shirt)" 
              value={newItem.type}
              onChange={(e) => setNewItem({...newItem, type: e.target.value})}
            />
            <Input 
              placeholder="Color" 
              value={newItem.color}
              onChange={(e) => setNewItem({...newItem, color: e.target.value})}
            />
            <Input 
              placeholder="Style (e.g., Casual)" 
              value={newItem.style}
              onChange={(e) => setNewItem({...newItem, style: e.target.value})}
            />
          </div>

          {/* Category and Location Selects */}
          <Select 
            value={newItem.category} 
            onValueChange={(value) => setNewItem({...newItem, category: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.slice(1).map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={newItem.location} 
            onValueChange={(value) => setNewItem({...newItem, location: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              {sections.map(section => (
                <SelectItem key={section.id} value={section.name}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            className="w-full" 
            onClick={handleAddItem}
            disabled={
              !newItem.name || 
              !newItem.category || 
              !newItem.location || 
              !imageFile
            }
          >
            {isUploading ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <h1 
              className="text-xl font-bold cursor-pointer" 
              onClick={() => {
                setActiveTab('all-items');
                setSelectedSection(null);
              }}
            >
              Smart Wardrobe
            </h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStyleAssistantClick}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Style Assistant
              </Button>
              <Button 
                variant="default" 
                className="bg-gray-900 hover:bg-gray-800"
                onClick={() => setShowUploadModal(true)}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="mb-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={activeTab === category.id ? "default" : "ghost"}
                className={`rounded-full transition-colors duration-200 
                  ${activeTab === category.id 
                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                    : 'hover:bg-gray-100'}`}
                onClick={() => {
                  setActiveTab(category.id);
                  setSelectedSection(null);
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'all-items' && <SectionManager />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 
                    hover:bg-white/90 transition-colors`}
                  onClick={() => toggleFavorite(item.id)}
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      item.tags.includes('favorite') 
                        ? 'fill-gray-900 text-gray-900' 
                        : 'text-gray-500'
                    }`} 
                  />
                </Button>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">{item.name}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline">{item.type}</Badge>
                  <Badge variant="outline">{item.color}</Badge>
                  <Badge variant="outline">{item.style}</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Location: {item.location}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <UploadModal />
    </div>
  );
};

export default SmartWardrobe;