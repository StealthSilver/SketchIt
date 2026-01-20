# AI Diagram Generation - OpenAI Integration

## Summary of Changes

I've completely rewritten the AI diagram generation logic to use **OpenAI's gpt-4o-mini model** instead of Google Gemini. The new implementation includes robust JSON validation, error handling, and debugging capabilities.

---

## Files Modified

### 1. `/src/app/api/generate-svg/route.ts`

**Complete rewrite** to use OpenAI API:

- **Model**: `gpt-4o-mini` (affordable and fast)
- **JSON Mode**: Uses `response_format: { type: "json_object" }` to force valid JSON responses
- **Validation**:
  - Checks if response contains diagram data
  - Validates shapes array exists and is not empty
  - Filters out invalid shapes
  - Returns debug info (total shapes, valid shapes, filtered count)
- **Error Handling**:
  - 401: Invalid API key with helpful message
  - 429: Rate limit exceeded with retry-after info
  - 402: Insufficient credits
  - Detailed console logging for debugging
- **Response**: Returns validated diagram data with debug information

### 2. `/src/components/AIDrawer.tsx`

Enhanced user feedback and error handling:

- **Success Messages**: Shows when shapes are successfully generated
- **Improved Error Handling**:
  - Validates API response structure
  - Checks for empty shapes array
  - Provides detailed console logs
- **Auto-close**: Automatically closes drawer after successful generation (1.5s delay)
- **Debug Info Display**: Shows how many shapes were generated and filtered

### 3. `/src/components/InfiniteCanvas.tsx`

Better diagram processing with detailed logging:

- **Enhanced Logging**:
  - Logs each shape being processed
  - Counts processed vs skipped shapes
  - Shows final statistics
- **Error Recovery**: Individual shape errors don't break entire diagram
- **Validation**: Checks each shape for required properties before processing

### 4. `.env.example`

Created environment variable template (your `.env.local` already has the keys configured)

---

## How It Works

### 1. User Input

User enters a prompt like "house" or "car" in the AI drawer

### 2. API Request

```typescript
POST / api / generate - svg;
Body: {
  prompt: "house";
}
```

### 3. OpenAI Processing

- System prompt defines strict JSON format rules
- User prompt requests diagram for the object
- Model: `gpt-4o-mini` with JSON mode enabled
- Returns structured shape data

### 4. Response Validation

```typescript
{
  "diagram": {
    "shapes": [
      {
        "id": "base",
        "type": "rectangle",
        "width": 200,
        "height": 150,
        "bottomLeft": { "x": 100, "y": 100 }
      },
      // ... more shapes
    ]
  },
  "debug": {
    "totalShapes": 5,
    "validShapes": 5,
    "filteredOut": 0
  }
}
```

### 5. Canvas Rendering

- Each shape is converted to canvas coordinates
- Shapes are centered on the canvas
- Added to the lines array for rendering

---

## Testing the Integration

### Check API Key

Your `.env.local` already has the OpenAI API key configured:

```
OPENAI_API_KEY=sk-proj-...
```

### Monitor Console Logs

Open browser DevTools → Console tab to see:

- ✅ "Sending request to generate diagram for: house"
- ✅ "OpenAI Response: {...}"
- ✅ "Generated 5 shapes: [...]"
- ✅ "Diagram generation complete: 5 shapes processed, 0 skipped, 5 added to canvas"

### Test Flow

1. Click "AI Generate" button
2. Enter a simple prompt (e.g., "house", "car", "tree")
3. Click "Generate Diagram" or press Enter
4. Watch console for detailed logs
5. Check for success message in drawer
6. Verify shapes appear on canvas

---

## Debugging Tips

### If shapes don't appear:

1. **Check Console** - Look for error messages
2. **Verify API Response** - Should see "OpenAI Response: {...}" in console
3. **Check Shape Validation** - Console shows which shapes were processed/skipped
4. **Inspect Canvas** - Use browser DevTools to check if lines array is updated

### Common Issues:

**❌ "Invalid API key"**

- Solution: Verify `OPENAI_API_KEY` in `.env.local`

**❌ "Rate limit exceeded"**

- Solution: Wait 5 seconds between requests (enforced by cooldown)

**❌ "No shapes generated"**

- Solution: Try a simpler prompt (single word like "house" works best)

**❌ "Insufficient credits"**

- Solution: Add credits to your OpenAI account

---

## API Key Information

### Your Current Keys (from .env.local):

- ✅ **OPENAI_API_KEY**: Configured and ready
- ✅ **MONGODB_URI**: Configured for canvas saving
- ✅ **GOOGLE_API_KEY**: Legacy (not used anymore)

### Get New Keys:

- OpenAI: https://platform.openai.com/api-keys
- Pricing: https://openai.com/api/pricing/
- gpt-4o-mini: ~$0.00015 per request (very cheap!)

---

## Model Comparison

### GPT-4o-mini (NEW ✅)

- **Cost**: $0.000150 per 1K input tokens
- **Speed**: Very fast (~1-2 seconds)
- **JSON Mode**: Native support
- **Quality**: Excellent for simple diagrams

### Google Gemini (OLD ❌)

- **Issues**: Rate limits, inconsistent JSON format
- **Replaced**: No longer used in the codebase

---

## Next Steps

1. **Test the integration**:
   ```bash
   npm run dev
   ```
2. **Open the draw page**: http://localhost:3000/draw

3. **Click "AI Generate"** and try these prompts:
   - house
   - car
   - robot
   - tree
   - computer

4. **Monitor the console** for detailed logs

5. **Verify shapes appear** on the canvas

---

## Success Indicators

✅ No console errors  
✅ "OpenAI Response" appears in console  
✅ Success message shows in drawer  
✅ Shapes appear on canvas  
✅ Debug info shows processed shapes count

---

## Support

If you encounter issues:

1. **Check Console** - Most issues are logged there
2. **Verify API Key** - Ensure it's valid and has credits
3. **Try Simple Prompts** - Start with "house" or "car"
4. **Check Network Tab** - Verify API requests are being sent

The system now has comprehensive logging at every step, making it easy to identify where issues occur.
