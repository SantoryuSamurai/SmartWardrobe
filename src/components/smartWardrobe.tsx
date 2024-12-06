"use client";

import React, { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import supabase from "../config/supabaseClient"
import { 
  PlusCircle, 
  Upload, 
  X,  
  Search, 
  Edit2, 
  Trash2, 
  Heart,
  Plus,
  LayoutGrid
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
import { Toaster } from '@/components/ui/toaster';
import { toast } from "@/components/ui/use-toast";

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
  tags: string[];
}

const SmartWardrobe = () => {
  // Existing states...
  const [sections, setSections] = useState<Section[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [activeTab, setActiveTab] = useState('all-items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  
  // New state for section management
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<number | null>(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [isAddingSectionMode, setIsAddingSectionMode] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [categories] = useState([
    { 
      id: 'all-items', 
      name: 'All Items', 
      icon: LayoutGrid 
    },
    { 
      id: 'favorites', 
      name: 'Favorites', 
      icon: Heart 
    },
  ]);

  // Fetch sections on component mount
  useEffect(() => {
    fetchSections();
  }, []);

  // Fetch wardrobe items on component mount
  useEffect(() => {
    fetchWardrobeItems();
  }, []);

  // Fetch Sections from Supabase
  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('name', { ascending: true }); 
  
      if (error) {
        toast({
          title: "Fetch Failed",
          description: "Could not load sections.",
          variant: "destructive"
        });
        return;
      }
  
      setSections(data || []);
    } catch (error) {
      console.error('Fetching sections error:', error);
    }
  };

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

  // const handleStyleAssistantClick = () => {
  //   window.open('https://cdn.botpress.cloud/webchat/v2.2/shareable.html?configUrl=https://files.bpcontent.cloud/2024/11/19/03/20241119030807-4TNHTARG.json', '_blank');
  // };

  // const handleAddItemClick = () => {
  //   setIsAddingItem(true);
  //   setActiveTab('all-items');
  //   setSelectedSection(null);
  //   window.scrollTo(0, 0);
  // };

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
      tabFilter = item.tags?.includes('favorite') || false;
    } else if (activeTab === 'all-items') {
      tabFilter = selectedSection ? item.location === selectedSection.name : true;
    } else {
      tabFilter = item.category === activeTab;
    }

    const searchFilter = 
    !searchQuery || 
    (item.name ?? '').toLowerCase().includes((searchQuery ?? '').toLowerCase());

    return tabFilter && searchFilter;
  });

    // Edit Section Function
    const handleEditSection = async () => {
      if (!editingSectionId || !editSectionName.trim()) {
        toast({
          title: "Invalid Input",
          description: "Section name cannot be empty.",
          variant: "destructive"
        });
        return;
      }
  
      try {
        const { error } = await supabase
          .from('sections')
          .update({ name: editSectionName })
          .eq('id', editingSectionId);
  
        if (error) throw error;
  
        // Update local state
        setSections(sections.map(section => 
          section.id === editingSectionId 
            ? { ...section, name: editSectionName } 
            : section
        ));
  
        // Update wardrobe items with new section name
        const { error: itemUpdateError } = await supabase
          .from('wardrobe_items')
          .update({ location: editSectionName })
          .eq('location', sections.find(s => s.id === editingSectionId)?.name || '');
  
        if (itemUpdateError) throw itemUpdateError;
  
        // Reset edit state
        setEditingSectionId(null);
        setEditSectionName('');
  
        toast({
          title: "Section Updated",
          description: "Section has been successfully updated.",
          duration: 3000
        });
      } catch (error) {
        console.error('Edit section error:', error);
        toast({
          title: "Update Failed",
          description: "Could not update section.",
          variant: "destructive"
        });
      }
    };
  
    // Delete Section Function
    const handleDeleteSection = async () => {
      if (!deletingSectionId) return;
  
      try {
        // First, check if section has any items
        const { count, error: countError } = await supabase
          .from('wardrobe_items')
          .select('*', { count: 'exact' })
          .eq('location', sections.find(s => s.id === deletingSectionId)?.name || '');
  
        if (countError) throw countError;
  
        if (count && count > 0) {
          toast({
            title: "Delete Failed",
            description: "Cannot delete a section with items. Move items first.",
            variant: "destructive"
          });
          return;
        }
  
        // Delete the section
        const { error } = await supabase
          .from('sections')
          .delete()
          .eq('id', deletingSectionId);
  
        if (error) throw error;
  
        // Update local state
        setSections(sections.filter(section => section.id !== deletingSectionId));
  
        // Reset delete state
        setDeletingSectionId(null);
  
        toast({
          title: "Section Deleted",
          description: "Section has been successfully deleted.",
          duration: 3000
        });
      } catch (error) {
        console.error('Delete section error:', error);
        toast({
          title: "Delete Failed",
          description: "Could not delete section.",
          variant: "destructive"
        });
      }
    };

    const handleAddSection = async () => {
      // Validate section name
      if (!newSectionName.trim()) {
        toast({
          title: "Invalid Input",
          description: "Section name cannot be empty.",
          variant: "destructive"
        });
        return;
      }
  
      // Check if section name already exists
      const sectionExists = sections.some(
        section => section.name.toLowerCase() === newSectionName.trim().toLowerCase()
      );
  
      if (sectionExists) {
        toast({
          title: "Duplicate Section",
          description: "A section with this name already exists.",
          variant: "destructive"
        });
        return;
      }
  
      try {
        // Insert new section to Supabase
        const { data, error } = await supabase
          .from('sections')
          .insert([{ name: newSectionName.trim() }])
          .select();
  
        if (error) throw error;
  
        // Update local state
        setSections([...sections, data[0]]);
  
        // Reset add section mode and input
        setIsAddingSectionMode(false);
        setNewSectionName('');
  
        // Show success toast
        toast({
          title: "Section Added",
          description: "Your new section has been successfully created.",
          duration: 3000
        });
      } catch (error) {
        console.error('Add section error:', error);
        toast({
          title: "Add Section Failed",
          description: "Could not add new section. Please try again.",
          variant: "destructive"
        });
      }
    };
  

  // Section Manager Component
  const SectionManager = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {/* Add Section Card */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2 border-gray-300 hover:border-gray-400"
        onClick={() => setIsAddingSectionMode(true)}
      >
        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
          {isAddingSectionMode ? (
            <div className="w-full space-y-2">
              <Input 
                placeholder="Enter section name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection();
                  if (e.key === 'Escape') {
                    setIsAddingSectionMode(false);
                    setNewSectionName('');
                  }
                }}
                autoFocus
                className="w-full"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsAddingSectionMode(false);
                    setNewSectionName('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleAddSection}
                >
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Plus className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm text-center">
                Add New Section
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Sections */}
      {sections.map((section) => (
        <Card 
          key={section.id}
          className={`cursor-pointer hover:shadow-md transition-shadow
            ${selectedSection?.id === section.id ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedSection(selectedSection?.id === section.id ? null : section)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              {editingSectionId === section.id ? (
                <Input
                  value={editSectionName}
                  onChange={(e) => setEditSectionName(e.target.value)}
                  onBlur={handleEditSection}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSection();
                    if (e.key === 'Escape') {
                      setEditingSectionId(null);
                      setEditSectionName('');
                    }
                  }}
                  autoFocus
                />
              ) : (
                <h3 className="font-medium">{section.name}</h3>
              )}
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card selection
                    setEditingSectionId(section.id);
                    setEditSectionName(section.name);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Dialog 
                  open={deletingSectionId === section.id}
                  onOpenChange={(open) => {
                    if (!open) setDeletingSectionId(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="sm" 
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card selection
                        setDeletingSectionId(section.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Section</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete the section {section.name}? 
                        This action cannot be undone. The section must be empty to delete.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setDeletingSectionId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          handleDeleteSection();
                          setDeletingSectionId(null);
                        }}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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

  // Delete Wardrobe Item Function
  const handleDeleteItem = async () => {
    if (!deletingItemId) return;

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', deletingItemId);

      if (error) throw error;

      // Update local state
      setWardrobe(wardrobe.filter(item => item.id !== deletingItemId));

      // Reset deleting state
      setDeletingItemId(null);

      // Show success toast
      toast({
        title: "Item Deleted",
        description: "Your wardrobe item has been successfully deleted.",
        duration: 3000
      });
    } catch (error) {
      console.error('Delete item error:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const AddItemDialog: React.FC<{ 
    sections: Section[]; 
    onItemAdded: (item: WardrobeItem) => void,
    initialItem?: WardrobeItem | null
  }> = ({ sections, onItemAdded, initialItem }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(!!initialItem);
    const [itemName, setItemName] = useState(initialItem?.name || '');
    const [location, setLocation] = useState(initialItem?.location || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
      initialItem?.imageUrl || null
    );
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
      const filePath = `${fileName}`;
  
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wardrobeImages')
        .upload(filePath, imageFile);
  
      if (uploadError) {
        throw uploadError;
      }

       // Log uploadData here
    if (uploadData) {
      console.log('Upload data:', uploadData);
      // Perform additional logic with uploadData if necessary
    }
  
      // Manually construct the public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/wardrobeImages/${filePath}`;
  
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
    if (!itemName || !location) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      let imageUrl = initialItem?.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        const newImageUrl = await uploadImageToStorage();
        if (!newImageUrl) {
          return; // Image upload failed
        }
        imageUrl = newImageUrl;
      }

      // Prepare item data
      const itemData: Partial<WardrobeItem> = {
        name: itemName,
        location: location,
        imageUrl: imageUrl || '',
      };

      if (initialItem) {
        // Update existing item
        const { data, error } = await supabase
          .from('wardrobe_items')
          .update(itemData)
          .eq('id', initialItem.id)
          .select();

           // Log the data
          console.log('Update response data:', data);

        if (error) {
          throw error;
        }

        // Update local state
        setWardrobe(wardrobe.map(item => 
          item.id === initialItem.id ? { ...item, ...itemData } : item
        ));

        // Show success toast
        toast({
          title: "Item Updated",
          description: "Your wardrobe item has been successfully updated.",
          duration: 3000
        });
      } else {
        // Add new item
        const { data, error } = await supabase
          .from('wardrobe_items')
          .insert([{
            ...itemData,
            category: 'all-items',
            tags: [] as string[]
          }])
          .select();

        if (error) {
          throw error;
        }

        // Notify parent component
        onItemAdded(data[0]);

        // Show success toast
        toast({
          title: "Item Added",
          description: "Your wardrobe item has been successfully added.",
          duration: 3000
        });
      }

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
      setEditingItem(null);

    } catch (error) {
      console.error('Add/Edit item error:', error);
      toast({
        title: initialItem ? "Update Failed" : "Add Item Failed",
        description: "Could not process your item. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog 
      open={isDialogOpen} 
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          resetForm();
          setEditingItem(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="bg-gray-900 hover:bg-gray-800"
        >
          {initialItem ? (
            <>
              <Edit2 className="h-5 w-5 mr-2" />
              Edit Item
            </>
          ) : (
            <>
              <PlusCircle className="h-5 w-5 mr-2" />
              Add Item
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialItem ? 'Edit the Wardrobe Item' : 'Add New Wardrobe Item'}
          </DialogTitle>
          <DialogDescription>
            {
              'Fill in the details of your new wardrobe item.'
            }
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
                    <Image 
                          src={imagePreview} 
                          alt="Preview" 
                          width={256} 
                          height={256} 
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

return (
  <>
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
            SmartWardrobe
          </h1>
          <div className="flex items-center gap-4">
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={handleStyleAssistantClick}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Style Assistant
            </Button> */}
            
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
          {categories.map(category => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.id}
                variant={activeTab === category.id ? "default" : "ghost"}
                className={`rounded-full transition-colors duration-200 flex items-center gap-2
                  ${activeTab === category.id 
                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                    : 'hover:bg-gray-100'}`}
                onClick={() => {
                  setActiveTab(category.id);
                  setSelectedSection(null);
                }}
              >
                <IconComponent className="h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'all-items' && !isAddingItem && <SectionManager />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow relative">
              <div className="relative">
              <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  width={256} 
                  height={192} 
                  className="w-full h-48 object-cover"
              />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/80 hover:bg-white/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-gray-700" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={`h-8 w-8 rounded-full bg-white/80 
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
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white/80 hover:bg-white/90 text-red-500"
                      onClick={() => setDeletingItemId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                 </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Location: {item.location}
                </p>
              </CardContent>
            </Card>
      ))}
    </div>

    {/* Add Dialogs for Edit and Delete Confirmations */}
    {editingItem && (
      <AddItemDialog 
        sections={sections} 
        onItemAdded={handleItemAdded}
        initialItem={editingItem}
      />
    )}

    <Dialog 
      open={deletingItemId !== null}
      onOpenChange={() => setDeletingItemId(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Wardrobe Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setDeletingItemId(null)}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteItem}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
    <Toaster />
  </div>
  {/* Botpress Webchat Scripts */}
  <Script
        src="https://cdn.botpress.cloud/webchat/v2.2/inject.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://files.bpcontent.cloud/2024/11/19/03/20241119030806-WXSOOSV3.js"
        strategy="afterInteractive"
      />
  </>
);
};

export default SmartWardrobe;