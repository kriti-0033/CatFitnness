import glob
import os
import random
import subprocess
import time

import yt_dlp

# Input the playlist URL and output directory
playlist_url = input("Enter YouTube Playlist Link: ").strip()
base_dir = input("Enter output directory (leave empty for current dir): ").strip()

# Use current directory if empty
if not base_dir:
    base_dir = os.getcwd()

# Function to create a folder for the playlist
def create_playlist_folder(base_directory, playlist_title):
    # Sanitize folder name
    folder_name = playlist_title.replace(" ", "_").replace("/", "_").replace("\\", "_")[:60]
    folder_path = os.path.join(base_directory, folder_name)
    
    # Create directory if not exists
    os.makedirs(folder_path, exist_ok=True)
    return folder_path

# Function to save video titles to a text file
def save_video_names(folder_path, video_titles):
    txt_file_path = os.path.join(folder_path, "video_names.txt")
    with open(txt_file_path, "w", encoding="utf-8") as f:
        for title in video_titles:
            f.write(title + "\n")
    print(f"Video names saved to: {txt_file_path}")

# Function to trim videos using FFmpeg (4 seconds from start, 5 seconds from end)
def trim_video(input_file, output_file, duration):
    try:
        # Check if the video duration is long enough
        if duration <= 9:
            print(f"Video too short for trimming ({duration}s), skipping...")
            return False

        # Check if ffmpeg exists
        try:
            subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except FileNotFoundError:
            print("FFmpeg not found in PATH. Skipping trimming.")
            return False

        # FFmpeg command to trim 4 seconds from the start and 5 seconds from the end
        cmd = [
            "ffmpeg", "-y", "-i", input_file,
            "-ss", "4", "-to", str(duration - 5),
            "-c", "copy", output_file
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception as e:
        print(f"Trimming failed: {str(e)}")
        return False

# yt-dlp configuration
ydl_opts = {
    'format': 'best[height<=720]/bestvideo[height<=720]+bestaudio/best',  # Limit quality
    'restrictfilenames': True,
    'merge_output_format': 'mp4',
    'quiet': False,  # Enable output for better visibility
    'outtmpl': '',  # To be set later
    'verbose': False,
    'ignoreerrors': True,
    'concurrent_fragment_downloads': 1,  # Low concurrency
    'max_sleep_interval': 5,
    'sleep_interval': 1,
    'max_retries': 10,
    'socket_timeout': 30,
    'extractor_retries': 5,
    'fragment_retries': 10,
}

try:
    # Try to get playlist info by individual videos if playlist fails
    print("Fetching individual videos from playlist...")
    
    # Get list of video IDs first
    with yt_dlp.YoutubeDL({'extract_flat': True, 'quiet': True}) as ydl:
        info = ydl.extract_info(playlist_url, download=False)
        
    if not info or 'entries' not in info:
        print("Failed to fetch playlist information.")
        exit(1)
    
    playlist_title = info.get('title', 'YouTube_Playlist')
    folder_path = create_playlist_folder(base_dir, playlist_title)
    print(f"Downloading to: {folder_path}")
    
    # Update output template - use video ID to ensure uniqueness
    ydl_opts['outtmpl'] = os.path.join(folder_path, '%(id)s - %(title)s.%(ext)s')

    # Process each video entry
    video_titles = []
    total_videos = sum(1 for e in info['entries'] if e)
    current_video = 0
    successfully_downloaded = []  # Track successfully downloaded videos

    for entry in info['entries']:
        if not entry:
            continue
        
        current_video += 1
        video_id = entry.get('id')
        
        if not video_id:
            continue
        
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        print(f"\nProcessing video [{current_video}/{total_videos}]: {video_id}")
        
        # Get video info individually
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                video_info = ydl.extract_info(video_url, download=False)
                
            video_title = video_info.get('title', f'Video_{video_id}')
            video_duration = video_info.get('duration', 0)
            
            print(f"Title: {video_title}")
            print(f"Duration: {video_duration} seconds")
            
            # Download video with retry logic
            download_success = False
            download_path = None
            for attempt in range(1, 4):
                try:
                    print(f"Download attempt {attempt}/3...")
                    download_opts = ydl_opts.copy()
                    if attempt > 1:
                        # Try lower quality on subsequent attempts
                        download_opts['format'] = f'best[height<={720-(attempt-1)*240}]/best'
                    
                    with yt_dlp.YoutubeDL(download_opts) as ydl:
                        info_dict = ydl.extract_info(video_url, download=True)
                        download_path = ydl.prepare_filename(info_dict)
                    
                    download_success = True
                    break
                except Exception as e:
                    print(f"Download attempt {attempt} failed: {str(e)}")
                    time.sleep(3)
            
            if not download_success or not download_path:
                print(f"Failed to download {video_title} after multiple attempts.")
                continue
            
            # Use the actual downloaded file path instead of trying to find it
            original_file = download_path
            
            # Trim the video if it's long enough
            if video_duration > 9:
                trimmed_file = os.path.splitext(original_file)[0] + "_trimmed.mp4"
                if trim_video(original_file, trimmed_file, video_duration):
                    os.remove(original_file)  # Remove the original file
                    os.rename(trimmed_file, original_file)  # Rename trimmed file
                    print(f"Successfully trimmed: {video_title}")
            
            # Add to the video titles list - only add if download was successful
            video_titles.append(video_title)
            successfully_downloaded.append(video_title)
            
            # Add delay between downloads
            if current_video < total_videos:
                delay = random.uniform(2, 4)
                print(f"Waiting {delay:.1f} seconds before next download...")
                time.sleep(delay)
                
        except Exception as e:
            print(f"Error processing video {video_id}: {str(e)}")
    
    # Save video titles to a text file - ONLY if we have downloaded videos
    if successfully_downloaded:
        save_video_names(folder_path, successfully_downloaded)
        print(f"\nPlaylist download complete. {len(successfully_downloaded)} videos downloaded.")
        print(f"Files saved to: {folder_path}")
        print(f"Video titles saved to: {os.path.join(folder_path, 'video_names.txt')}")
    else:
        print("\nNo videos were successfully downloaded.")

except Exception as e:
    print(f"An error occurred: {str(e)}")