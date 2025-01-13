# Twitter Thread Editor

A powerful web-based tool designed to help you craft, edit, and publish engaging Twitter threads efficiently. Built with Next.js and powered by AI, this editor streamlines the thread creation process while ensuring optimal engagement and readability.

## Features

### Core Features
- **Real-time Character Counter**: Stay within Twitter's 280-character limit with live tracking
- **Thread Visualization**: 
  - View your entire thread in a vertical list format
  - Drag-and-drop functionality to reorder tweets
- **Draft Management**: Save and organize threads with tags and topics
- **Smart Editing Assistance**: Get suggestions for improving clarity and conciseness
- **Direct Twitter Integration**: Post threads directly to Twitter (requires personal access token)

### Advanced Features
- **AI-Powered Enhancements**:
  - Flow analysis for cohesive narratives
  - Engagement predictions
  - Tone adjustment suggestions
- **Multimedia Support**: Add images, GIFs, and videos to your tweets
- **Keyword Highlighting**: Identify trending and relevant keywords
- **Smart Scheduling**: Post threads at optimal times
- **CTA Integration**: Get prompts for effective calls-to-action

## Tech Stack
- Frontend: Next.js with Tailwind CSS
- State Management: Zustand
- AI Integration: OpenAI GPT API
- Drag & Drop: React DnD
- Data Fetching: React Query
- Form Handling: Formik + Yup
- Date/Time: Luxon

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Personal Twitter API access tokens
- OpenAI API key

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/mikeyny/thread-maker.git
   cd twitter-thread-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_SECRET=your_access_token_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Writing Threads**
   - Start typing in the editor
   - Character count updates automatically
   - Drag and drop tweets to reorder
   - Use AI suggestions to improve content

2. **Managing Drafts**
   - Save threads as drafts
   - Tag and categorize for organization
   - Search and filter saved drafts

3. **Publishing**
   - Post directly to Twitter
   - Schedule for optimal times
   - Add media attachments

## Contributing

We are not accepting contributions at this time, but plan to open for community contributions soon.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [MIT License](https://opensource.org/licenses/MIT) for details.


## Acknowledgments

- OpenAI for providing the GPT API
- The Next.js team for the amazing framework
- Contributors and early adopters


