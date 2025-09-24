import { useState, useEffect } from 'react';
import { VITE_BACKEND_URL } from "../config/config";

interface AnnouncementNotification {
  hasNewAnnouncements: boolean;
  newCount: number;
}

export const useAnnouncementNotification = (): AnnouncementNotification => {
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const checkForNewAnnouncements = async () => {
      try {
        // Get the last viewed timestamp from localStorage
        const lastViewed = localStorage.getItem('last_announcement_view');
        const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0);

        // Fetch recent announcements
        const response = await fetch(`${VITE_BACKEND_URL}/api/v1/announcements?limit=5`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          // Count announcements newer than last viewed
          const newAnnouncements = data.data.filter((announcement: any) => 
            new Date(announcement.createdAt) > lastViewedDate
          );

          setNewCount(newAnnouncements.length);
          setHasNewAnnouncements(newAnnouncements.length > 0);
        }
      } catch (error) {
        console.error('Error checking for new announcements:', error);
      }
    };

    checkForNewAnnouncements();

    // Check every 5 minutes for new announcements
    const interval = setInterval(checkForNewAnnouncements, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { hasNewAnnouncements, newCount };
};

export const markAnnouncementsAsViewed = () => {
  localStorage.setItem('last_announcement_view', new Date().toISOString());
};
