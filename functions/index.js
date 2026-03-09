const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

// Make the current user an admin (call from browser)
exports.makeMeAdmin = onRequest(async (req, res) => {
  try {
    // Get the ID token from the request
    const authHeader = req.headers.authorization;
    const idToken = authHeader && authHeader.split("Bearer ")[1];

    if (!idToken) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    // Verify the token and get the UID
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Set admin claim
    await admin.auth().setCustomUserClaims(uid, {admin: true});

    logger.info(`Admin claim set for user: ${uid}`);
    res.json({
      success: true,
      message: "✅ Admin claim set! Please log out and log back in.",
    });
  } catch (error) {
    logger.error("Error setting admin claim:", error);
    res.status(500).json({error: error.message});
  }
});

// Set admin by UID (for existing admins)
exports.setAdminByUid = onRequest(async (req, res) => {
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    // Get the caller's ID token
    const authHeader = req.headers.authorization;
    const idToken = authHeader && authHeader.split("Bearer ")[1];

    if (!idToken) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    // Verify the caller is already an admin
    const callerToken = await admin.auth().verifyIdToken(idToken);

    if (!callerToken.admin) {
      res.status(403).json({error: "Only admins can assign admin roles"});
      return;
    }

    // Get the target UID from request body
    const {uid} = req.body;

    if (!uid) {
      res.status(400).json({error: "UID is required"});
      return;
    }

    // Set admin claim for target user
    await admin.auth().setCustomUserClaims(uid, {admin: true});

    logger.info(`Admin claim set for user: ${uid} by: ${callerToken.uid}`);
    res.json({
      success: true,
      message: `✅ Admin claim set for ${uid}`,
    });
  } catch (error) {
    logger.error("Error setting admin claim:", error);
    res.status(500).json({error: error.message});
  }
});

// Hello world test function
exports.helloWorld = onRequest((req, res) => {
  res.json({message: "Hello from Firebase!"});
});
