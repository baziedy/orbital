import unittest
from app.routes.guide import GuideRequest, ask_guide

class LocalGuideTests(unittest.IsolatedAsyncioTestCase):
    async def test_notes_keyword_returns_formatting_help(self):
        response = await ask_guide(GuideRequest(message="How do I add notes to my report?"))
        self.assertEqual(response.mode, "local")
        self.assertIn("Study Notes", response.answer)
        self.assertIn("bold and italic", " ".join(response.keywords))

    async def test_compare_keyword_suggests_studio(self):
        response = await ask_guide(GuideRequest(message="How do I compare epochs?"))
        self.assertEqual(response.destination, "/compare")
        self.assertIn("two epochs", response.keywords)

    async def test_starter_questions_route_to_their_matching_workspaces(self):
        cases = [
            ("How does image comparison work?", "/compare", "Blink"),
            ("How do I explore NASA imagery?", "/explore", "NASA/IPAC"),
            ("How do I view the sky?", "/explore", "Aladin"),
            ("Where can I find image sources?", "/sources", "image credits"),
            ("How do I create a research study?", "/research", "observation epochs"),
        ]
        for question, destination, expected_answer in cases:
            with self.subTest(question=question):
                response = await ask_guide(GuideRequest(message=question))
                self.assertEqual(response.destination, destination)
                self.assertIn(expected_answer.casefold(), response.answer.casefold())

if __name__ == "__main__":
    unittest.main()
