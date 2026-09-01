import asyncio
import os
import sys
from pathlib import Path

# Setup path
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))
sys.path.append(str(root_dir / "backend"))

from ai.chatbot_ai import executor

async def test_chat():
    print("Testing chat execution speed...")
    import time
    start = time.time()
    try:
        # We need to simulate a chat history
        chat_history = []
        user_input = "هل لديكم مفاتيح كهربائية؟"
        
        print(f"Sending message: {user_input}")
        result = await executor.ainvoke({"input": user_input, "chat_history": chat_history})
        
        end = time.time()
        print(f"Time taken: {end - start:.2f} seconds")
        print(f"Response: {result['output']}")
    except Exception as e:
        end = time.time()
        print(f"FAILED after {end - start:.2f} seconds")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_chat())
