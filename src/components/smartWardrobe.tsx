"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  PlusCircle, 
  Upload, 
  X, 
  MessageCircle, 
  Search, 
  Edit2, 
  Trash2, 
  Heart 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Toaster } from '@/components/ui/toaster';
import { toast } from "@/components/ui/use-toast";

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Interfaces (keep the existing interfaces)
interface Section {
  id: number;
  name: string;
  items?: number[];
}

interface WardrobeItem {
  id: number;
  name: string;
  location: string;
  imageUrl: string;
  category: string;
}

const AddItemDialog: React.FC<{ 
  sections: Section[]; 
  onItemAdded: (item: WardrobeItem) => void 
}> = ({ sections, onItemAdded }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPEG, PNG, or GIF image.",
          variant: "destructive"
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Image must be smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload image to Supabase storage
  const uploadImageToStorage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `wardrobe-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(filePath);

      if (urlError) {
        throw urlError;
      }

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Reset form
  const resetForm = () => {
    setItemName('');
    setLocation('');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!itemName || !location || !imageFile) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all fields and upload an image.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload image
      const imageUrl = await uploadImageToStorage();
      
      if (!imageUrl) {
        return; // Image upload failed
      }

      // Prepare item data
      const newItem: WardrobeItem = {
        id: Date.now(), // Temporary ID
        name: itemName,
        location: location,
        imageUrl: imageUrl,
        category: 'all-items'
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert([newItem])
        .select();

      if (error) {
        throw error;
      }

      // Use the returned ID from Supabase
      const insertedItem = data[0];

      // Notify parent component
      onItemAdded(insertedItem);

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);

      // Show success toast
      toast({
        title: "Item Added",
        description: "Your wardrobe item has been successfully added.",
        duration: 3000
      });

    } catch (error) {
      console.error('Add item error:', error);
      toast({
        title: "Add Item Failed",
        description: "Could not add item to wardrobe. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="bg-gray-900 hover:bg-gray-800"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Wardrobe Item</DialogTitle>
          <DialogDescription>
            Fill in the details of your new wardrobe item.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Upload Section */}
            <div>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center 
                  ${imagePreview ? 'border-gray-300' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="imageUpload"
                />
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="mx-auto max-h-64 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label 
                    htmlFor="imageUpload" 
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      Click to upload item image
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, or GIF (max 5MB)
                    </p>
                  </label>
                )}
              </div>
            </div>

            {/* Item Details Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name
                </label>
                <Input 
                  type="text" 
                  placeholder="Enter item name" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Select 
                  value={location}
                  onValueChange={setLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem 
                        key={section.id} 
                        value={section.name}
                      >
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <PlusCircle className="h-5 w-5 mr-2" />
              Add to Wardrobe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

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

  const handleStyleAssistantClick = () => {
    window.open('https://cdn.botpress.cloud/webchat/v2.2/shareable.html?configUrl=https://files.bpcontent.cloud/2024/11/19/03/20241119030807-4TNHTARG.json', '_blank');
  };

  const handleAddItemClick = () => {
    setIsAddingItem(true);
    setActiveTab('all-items');
    setSelectedSection(null);
    window.scrollTo(0, 0);
  };

  const handleItemAdded = (newItem: WardrobeItem) => {
    // Update wardrobe items state
    setWardrobe(prevItems => [...prevItems, newItem]);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              
              {/* Replace previous Add Item button with new Dialog Trigger */}
              <AddItemDialog 
                sections={sections} 
                onItemAdded={handleItemAdded} 
              />
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
        {isAddingItem && (
          <AddItemForm 
            sections={sections}
            onItemAdded={handleItemAdded}
          />
        )}
  
        {activeTab === 'all-items' && !isAddingItem && <SectionManager />}
  
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
      <Toaster />
    </div>
  );
};

export default SmartWardrobe;