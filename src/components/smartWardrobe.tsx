// src/components/smartWardrobe.tsx
'use client'
import React, { useState } from 'react';
import { PlusCircle, MessageCircle, Search, X, Heart, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SmartWardrobe = () => {
  // Add sections state
  const [sections] = useState([
    { id: 1, name: 'Drawer 1', items: [1, 2] },
    { id: 2, name: 'Drawer 2', items: [3, 4] },
    { id: 3, name: 'Closet', items: [5, 6] },
  ]);

  // Add wardrobe state with sample data
  const [wardrobe, setWardrobe] = useState([
    {
      id: 1,
      name: "Blue T-Shirt",
      type: "T-Shirt",
      color: "Blue",
      style: "Casual",
      location: "Drawer 1",
      imageUrl: "/api/placeholder/400/320",
      tags: ["summer", "favorite"],
      category: "casual"
    },
    {
      id: 2,
      name: "Black Dress",
      type: "Dress",
      color: "Black",
      style: "Formal",
      location: "Closet",
      imageUrl: "/api/placeholder/400/320",
      tags: ["formal", "winter"],
      category: "workwear"
    },
  ]);

  const [activeTab, setActiveTab] = useState('all-items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { type: 'assistant', text: "Hello! I'm your wardrobe assistant. How can I help you today?" }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  const categories = [
    { id: 'all-items', name: 'All Items' },
    { id: 'workwear', name: 'Work Wear' },
    { id: 'partywear', name: 'Party Wear' },
    { id: 'casual', name: 'Casual' },
    { id: 'favorites', name: 'Favorites' }
  ];

  const handleEditSection = (e, sectionId) => {
    e.stopPropagation();
    const section = sections.find(s => s.id === sectionId);
    console.log('Editing section:', section);
  };

  const handleDeleteSection = (e, sectionId) => {
    e.stopPropagation();
    console.log('Deleting section:', sectionId);
  };

  const toggleFavorite = (itemId) => {
    setWardrobe(wardrobe.map(item => {
      if (item.id === itemId) {
        const newTags = item.tags.includes('favorite')
          ? item.tags.filter(tag => tag !== 'favorite')
          : [...item.tags, 'favorite'];
        return { ...item, tags: newTags };
      }
      return item;
    }));
  };

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
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return tabFilter && searchFilter;
  });

  const UploadModal = () => (
    <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add your upload form here */}
          <p>Upload form content goes here</p>
        </div>
      </DialogContent>
    </Dialog>
  );

  const ChatbotDialog = () => (
    <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wardrobe Assistant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="h-[400px] overflow-y-auto space-y-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={() => {
              if (currentMessage.trim()) {
                setChatMessages([
                  ...chatMessages,
                  { type: 'user', text: currentMessage.trim() }
                ]);
                setCurrentMessage('');
              }
            }}>
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

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
                  onClick={(e) => handleEditSection(e, section.id)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-red-500"
                  onClick={(e) => handleDeleteSection(e, section.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {section.items.length} items
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
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
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChatbot(true)}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUploadModal(true)}
              >
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4 mb-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
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
                {category.id === 'favorites' && (
                  <Heart 
                    className={`h-4 w-4 mr-2 ${
                      activeTab === category.id ? 'fill-current' : ''
                    }`} 
                  />
                )}
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
                        ? 'fill-red-500 text-red-500' 
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
                <div className="flex flex-wrap gap-1">
                  {item.tags.filter(tag => tag !== 'favorite').map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <UploadModal />
      <ChatbotDialog />
    </div>
  );
};

export default SmartWardrobe;
