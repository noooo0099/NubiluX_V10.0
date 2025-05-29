import { useState } from "react";
import { Upload as UploadIcon, Image, Video, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Upload() {
  const [uploadType, setUploadType] = useState<"product" | "poster" | "video">("product");
  const [selectedSkins, setSelectedSkins] = useState<string[]>([]);
  const { toast } = useToast();

  const categories = [
    { value: "mobile_legends", label: "Mobile Legends" },
    { value: "pubg_mobile", label: "PUBG Mobile" },
    { value: "free_fire", label: "Free Fire" },
    { value: "valorant", label: "Valorant" },
    { value: "genshin_impact", label: "Genshin Impact" },
  ];

  const sampleSkins = [
    "Alucard - Viscount", "Miya - Moonlight Archer", "Layla - Malefic Gunner",
    "Tigreal - Fallen Guard", "Akai - Panda Warrior", "Franco - Wild Boar",
    "Bane - Count Dracula", "Alice - Blood Moon", "Nana - Wind Fairy",
    "Saber - Regulus", "Gord - Conqueror", "Zilong - Eastern Warrior"
  ];

  const handleSkinToggle = (skin: string) => {
    if (selectedSkins.includes(skin)) {
      setSelectedSkins(selectedSkins.filter(s => s !== skin));
    } else if (selectedSkins.length < 54) {
      setSelectedSkins([...selectedSkins, skin]);
    } else {
      toast({
        title: "Maximum limit reached",
        description: "You can select maximum 54 skins",
        variant: "destructive",
      });
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement product upload
    toast({
      title: "Product uploaded successfully!",
      description: "Your product is now live on the marketplace.",
    });
  };

  const handlePosterGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement poster generation payment
    toast({
      title: "Poster generation started",
      description: "Please complete the payment to continue.",
    });
  };

  const handleVideoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement video upload
    toast({
      title: "Video uploaded successfully!",
      description: "Your video is now available in the feed.",
    });
  };

  return (
    <div className="min-h-screen bg-nxe-dark px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Upload Content</h1>
      
      {/* Upload Type Selector */}
      <div className="flex space-x-4 mb-6">
        <Button
          onClick={() => setUploadType("product")}
          variant={uploadType === "product" ? "default" : "outline"}
          className="flex items-center space-x-2"
        >
          <UploadIcon className="h-4 w-4" />
          <span>Product</span>
        </Button>
        <Button
          onClick={() => setUploadType("poster")}
          variant={uploadType === "poster" ? "default" : "outline"}
          className="flex items-center space-x-2"
        >
          <Image className="h-4 w-4" />
          <span>Poster</span>
        </Button>
        <Button
          onClick={() => setUploadType("video")}
          variant={uploadType === "video" ? "default" : "outline"}
          className="flex items-center space-x-2"
        >
          <Video className="h-4 w-4" />
          <span>Video</span>
        </Button>
      </div>

      {uploadType === "product" && (
        <Card className="bg-nxe-card border-nxe-surface">
          <CardHeader>
            <CardTitle className="text-white">Upload Gaming Account</CardTitle>
            <p className="text-gray-400 text-sm">Post your gaming account for free</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProductSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Product Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mobile Legends Epic Account - 54 Skins"
                  className="bg-nxe-surface border-nxe-surface text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your account details, rank, items, etc."
                  className="bg-nxe-surface border-nxe-surface text-white min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Game Category</Label>
                <Select required>
                  <SelectTrigger className="bg-nxe-surface border-nxe-surface text-white">
                    <SelectValue placeholder="Select game category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-white">Price (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 2500000"
                  className="bg-nxe-surface border-nxe-surface text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-white">Thumbnail Image</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  className="bg-nxe-surface border-nxe-surface text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-nxe-primary hover:bg-nxe-primary/80 text-white"
              >
                Post Product (Free)
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {uploadType === "poster" && (
        <Card className="bg-nxe-card border-nxe-surface">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-nxe-accent" />
              <span>AI Poster Generation</span>
              <Badge className="bg-nxe-primary">Premium - Rp 5,000</Badge>
            </CardTitle>
            <p className="text-gray-400 text-sm">
              AI will automatically arrange your profile and skins into a beautiful poster
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePosterGeneration} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profile-image" className="text-white">Profile Image</Label>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="bg-nxe-surface border-nxe-surface text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Select Skins ({selectedSkins.length}/54)
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-nxe-surface rounded-lg">
                  {sampleSkins.map((skin) => (
                    <Button
                      key={skin}
                      type="button"
                      onClick={() => handleSkinToggle(skin)}
                      variant={selectedSkins.includes(skin) ? "default" : "outline"}
                      className="text-xs h-8 justify-start"
                    >
                      {skin}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-nxe-surface p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Poster Layout Preview</h4>
                <div className="text-gray-400 text-sm space-y-1">
                  <p>• Profile image will be placed at the top</p>
                  <p>• Skins arranged in 9×6 grid format</p>
                  <p>• Professional styling with game theme</p>
                  <p>• High-resolution output (720×1280)</p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={selectedSkins.length === 0}
                className="w-full bg-nxe-accent hover:bg-nxe-accent/80 text-white"
              >
                Generate Poster - Pay Rp 5,000 via QRIS
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {uploadType === "video" && (
        <Card className="bg-nxe-card border-nxe-surface">
          <CardHeader>
            <CardTitle className="text-white">Upload Gaming Video</CardTitle>
            <p className="text-gray-400 text-sm">Share your gaming highlights with the community</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVideoUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="video-title" className="text-white">Video Title</Label>
                <Input
                  id="video-title"
                  placeholder="e.g., Epic Mobile Legends Gameplay"
                  className="bg-nxe-surface border-nxe-surface text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-file" className="text-white">Video File</Label>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  className="bg-nxe-surface border-nxe-surface text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-category" className="text-white">Game Category</Label>
                <Select required>
                  <SelectTrigger className="bg-nxe-surface border-nxe-surface text-white">
                    <SelectValue placeholder="Select game category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-nxe-primary hover:bg-nxe-primary/80 text-white"
              >
                Upload Video
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
