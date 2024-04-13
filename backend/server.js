const express = require("express");
const cors = require("cors");
const router = express.Router();
const port = 4000;
const app = express();
const pool = require("./db");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// middleware
app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bhavana.s.1862@gmail.com",
    pass: "fxzd tbkp zucn gwqs", //app-pwd
  },
});

app.post("/signup", async (req, res) => {
  try {
    const {
      username,
      name,
      mail_id,
      phone_number,
      user_type,
      password,
      creator_id,
    } = req.body;

    // Check if the email ID is already registered
    const existingEmail = await pool.query(
      "SELECT * FROM userdata WHERE mail_id = $1",
      [mail_id]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "Email ID already exists" });
    }

    // Check if the username is already taken
    const existingUsername = await pool.query(
      "SELECT * FROM userdata WHERE username = $1",
      [username]
    );
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Insert data into the database
    const result = await pool.query(
      "INSERT INTO userdata (username, name, mail_id, phone_number, user_type, password, creator_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [username, name, mail_id, phone_number, user_type, password, creator_id]
    );

    // Send email to the user
    const mailOptions = {
      from: "bhavana.s.1862@gmail.com",
      to: mail_id,
      subject: "JMAN Training Platform",
      html: `<p>Hello ${name},</p>
              <p>Welcome to JMAN Training Platform</p>
             <p>Your account has been successfully created! You can login to the Training platform with the following credentials.</p>
             <p>Username: ${username}</p>
             <p>Mail ID: ${mail_id}</p>
             <p>Password: ${password}</p>
             <p></p>
             <p><a href="http://localhost:4000">Click here</a> to login.</p>
             <p>Happy Learning!</p>
             <p></p>
             <p>Thank You</p>
             <p>JMAN Group</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error occurred while sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
    res.status(201).json({
      message: "User signed up successfully",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Fetch user from the database based on email
    const user = await pool.query("SELECT * FROM userdata WHERE mail_id = $1", [
      email,
    ]);

    // Check if user exists
    if (user.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    // Verify password
    if (password !== user.rows[0].password) {
      return res.status(401).json({ error: "Invalid password" });
    }
    // Respond with success message or any other appropriate response

    res
      .status(200)
      .json({
        message: "Login successful",
        userName: user.rows[0].name,
        userId: user.rows[0].id,
        role: user.rows[0].user_type,
      });
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user data from the database based on user ID
    const user = await pool.query("SELECT * FROM userdata WHERE id = $1", [
      userId,
    ]);

    // Check if user exists
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Respond with user data
    res.status(200).json(user.rows[0]);
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
});

app.get("/users", async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await pool.query("SELECT * FROM userdata");
    // Respond with the retrieved users
    res.status(200).json(users.rows);
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
});

app.post("/save-training", async (req, res) => {
  try {
    const {
      training_topic,
      training_date,
      start_time,
      end_time,
      intended_audience,
      mail_sent,
    } = req.body;

    // Insert data into the database
    const result = await pool.query(
      "INSERT INTO training_schedules (training_topic, training_date, start_time, end_time, intended_audience, mail_sent) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        training_topic,
        training_date,
        start_time,
        end_time,
        intended_audience,
        mail_sent,
      ]
    );
    // Check if mail should be sent
    if (mail_sent) {
      const users = await pool.query(
        "SELECT mail_id FROM userdata WHERE user_type = $1",
        [intended_audience]
      );

      const mailOptions = {
        from: "bhavana.s.1862@gmail.com",
        subject: "Training Notification",
        html: `<p>Hello,</p>
                <p>A new training on "${training_topic}" has been scheduled for ${training_date} from ${start_time} to ${end_time}.</p>
                <p>Please log in to the platform for more details.</p>
                <p>Thank you</p>`,
      };

      const emails = users.rows.map((user) => user.mail_id);

      transporter.sendMail({ ...mailOptions, to: emails }, (error, info) => {
        if (error) {
          console.error("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    }

    res.status(201).json({
      message: "Training data saved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      message: "An error occurred while processing your request",
    });
  }
});

app.get("/trainings", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM training_schedules");
    const trainings = result.rows;
    client.release();
    res.status(200).json(trainings);
  } catch (error) {
    console.error("Error fetching trainings:", error);
    res.status(500).json({ message: "Error fetching trainings" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await pool.query("DELETE FROM userdata WHERE id = $1", [userId]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the user" });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, mail_id, phone_number, user_type } = req.body;

    // Check if the new email is already registered
    const existingEmail = await pool.query(
      "SELECT * FROM userdata WHERE mail_id = $1 AND id != $2",
      [mail_id, id]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "Email ID already exists" });
    }

    // Check if the new username is already taken
    const existingUsername = await pool.query(
      "SELECT * FROM userdata WHERE username = $1 AND id != $2",
      [username, id]
    );
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Update user data in the database
    const result = await pool.query(
      "UPDATE userdata SET username = $1, name = $2, mail_id = $3, phone_number = $4, user_type = $5 WHERE id = $6 RETURNING *",
      [username, name, mail_id, phone_number, user_type, id]
    );

    res.status(200).json({
      message: "User data updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      message: "An error occurred while processing your request",
    });
  }
});

app.put("/trainings/:id", async (req, res) => {
  try {
    const trainingId = req.params.id;
    const {
      training_topic,
      training_date,
      start_time,
      end_time,
      intended_audience,
      mail_sent,
    } = req.body;

    // Update the training in the database
    const result = await pool.query(
      "UPDATE training_schedules SET training_topic = $1, training_date = $2, start_time = $3, end_time = $4, intended_audience = $5, mail_sent = $6 WHERE id = $7 RETURNING *",
      [
        training_topic,
        training_date,
        start_time,
        end_time,
        intended_audience,
        mail_sent,
        trainingId,
      ]
    );

    res
      .status(200)
      .json({ message: "Training updated successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the training" });
  }
});

app.delete("/trainings/:id", async (req, res) => {
  try {
    const trainingId = req.params.id;

    // Delete the training from the database
    await pool.query("DELETE FROM training_schedules WHERE id = $1", [
      trainingId,
    ]);

    res.status(200).json({ message: "Training deleted successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the training" });
  }
});

app.get("/trainings/:id", async (req, res) => {
  try {
    const trainingId = req.params.id;

    // Fetch training data from the database based on training ID
    const training = await pool.query(
      "SELECT * FROM training_schedules WHERE id = $1",
      [trainingId]
    );

    // Check if training exists
    if (training.rows.length === 0) {
      return res.status(404).json({ error: "Training not found" });
    }
    // Respond with training data
    res.status(200).json(training.rows[0]);
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
});

app.post("/save-assessment", async (req, res) => {
  try {
    const {
      assessment_topic,
      assessment_link,
      total_marks,
      intended_audience,
      assessment_date,
      start_time,
      end_time,
      mail_sent,
      training_topic,
    } = req.body;

    // Insert data into the database
    const result = await pool.query(
      "INSERT INTO assessment_schedules (assessment_topic, assessment_link, intended_audience, total_marks, assessment_date, start_time, end_time, mail_sent, training_topic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        assessment_topic,
        assessment_link,
        intended_audience,
        total_marks,
        assessment_date,
        start_time,
        end_time,
        mail_sent,
        training_topic,
      ]
    );

    if (mail_sent) {
      const users = await pool.query(
        "SELECT mail_id FROM userdata WHERE user_type = $1",
        [intended_audience]
      );

      const mailOptions = {
        from: "bhavana.s.1862@gmail.com",
        subject: "Assessment Notification",
        html: `<p>Hello,</p>
                <p>An assessment on "${assessment_topic}" has been scheduled for ${assessment_date} from ${start_time} to ${end_time}.</p>
                <p>Please log in to the platform for more details.</p>
                <p>Find the assesment details below.</p>
                <p>click the link for the test: ${assessment_link}</p>
                <p>Thank you</p>`,
      };

      const emails = users.rows.map((user) => user.mail_id);

      transporter.sendMail({ ...mailOptions, to: emails }, (error, info) => {
        if (error) {
          console.error("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    }

    res.status(201).json({
      message: "Assessment data saved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      message: "An error occurred while processing your request",
    });
  }
});

app.get("/assessments", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM assessment_schedules");
    const assessments = result.rows;
    client.release();
    res.status(200).json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({ message: "Error fetching assessments" });
  }
});

app.delete("/assessments/:id", async (req, res) => {
  try {
    const assessmentId = req.params.id;

    // Delete the assessment from the database
    await pool.query("DELETE FROM assessment_schedules WHERE id = $1", [
      assessmentId,
    ]);

    res.status(200).json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the assessment" });
  }
});

app.get("/assessments/:id", async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const assessment = await pool.query(
      "SELECT * FROM assessment_schedules WHERE id = $1",
      [assessmentId]
    );
    if (assessment.rows.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    res.status(200).json(assessment.rows[0]);
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
});

app.put("/assessments/:id", async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const {
      assessment_topic,
      assessment_link,
      total_marks,
      intended_audience,
      assessment_date,
      start_time,
      end_time,
      mail_sent,
    } = req.body;

    const result = await pool.query(
      `UPDATE assessment_schedules 
       SET assessment_topic = $1, 
           assessment_link = $2, 
           intended_audience = $3, 
           total_marks = $4, 
           assessment_date = $5, 
           start_time = $6, 
           end_time = $7, 
           mail_sent = $8 
       WHERE id = $9 
       RETURNING *`,
      [
        assessment_topic,
        assessment_link,
        intended_audience,
        total_marks,
        assessment_date,
        start_time,
        end_time,
        mail_sent,
        assessmentId,
      ]
    );

    let intended_audience_id;
    if (intended_audience === "Employee") {
      intended_audience_id = 1;
    } else if (intended_audience === "Intern") {
      intended_audience_id = 2;
    } else {
      throw new Error("Invalid intended audience");
    }

    if (mail_sent) {
      const users = await pool.query(
        "SELECT mail_id FROM userdata WHERE user_type = $1",
        [intended_audience_id]
      );

      const mailOptions = {
        from: "bhavana.s.1862@gmail.com",
        subject: "Assessment Notification",
        html: `<p>Hello,</p>
        <p>Kindly note the update in the assessment details.</p>
                <p>An assessment on "${assessment_topic}" has been scheduled for ${assessment_date} from ${start_time} to ${end_time}.</p>
                <p>Please log in to the platform for more details.</p>
                <p>Find the assesment details below.</p>
                <p>click the link for the test: ${assessment_link}</p>
                <p>Thank you</p>`,
      };

      const emails = users.rows.map((user) => user.mail_id);

      transporter.sendMail({ ...mailOptions, to: emails }, (error, info) => {
        if (error) {
          console.error("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    }

    res.status(200).json({
      message: "Assessment data updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      message: "An error occurred while processing your request",
    });
  }
});

// Generate a random 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const verificationCodes = {};

app.post("/initiate-reset-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email exists in the database
    const user = await pool.query("SELECT * FROM userdata WHERE mail_id = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      // Email not found in the database
      return res.status(404).json({ message: "Email not found" });
    }

    const verificationCode = generateVerificationCode();
    verificationCodes[email] = verificationCode;
    const mailOptions = {
      from: "bhavana.s.1862@gmail.com",
      to: email,
      subject: "Password Reset Verification Code",
      html: `<p>Hello,</p>
             <p>Your verification code for password reset is: <strong>${verificationCode}</strong></p>
             <p>If you didn't request this, please ignore this email.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error occurred while sending email:", error);
        return res
          .status(500)
          .json({ message: "Failed to send verification code email" });
      } else {
        console.log("Email sent:", info.response);
        return res
          .status(200)
          .json({ message: "Verification code sent successfully" });
      }
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
});

app.post("/verify-reset-code", async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    if (verificationCodes[email] !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }
    await pool.query("UPDATE userdata SET password = $1 WHERE mail_id = $2", [
      newPassword,
      email,
    ]);
    delete verificationCodes[email];

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while resetting the password" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
