-- Create the database (if it doesn't exist already)
CREATE DATABASE FinalProj;

-- Create the table
CREATE TABLE userdata(
    id INT PRIMARY KEY,
    name VARCHAR(255),
    mail_id VARCHAR(255),
    phone_number VARCHAR(15),
    user_type INT,
    password VARCHAR(255),
    creator_id INT
    
);


CREATE SEQUENCE user_id_seq START 1;

CREATE TABLE userdata(
    id INTEGER PRIMARY KEY DEFAULT nextval('user_id_seq'),
    username VARCHAR(255),
    name VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(255),
    user_type INTEGER,
	creator_id INTEGER,
    password VARCHAR(255)
);

CREATE OR REPLACE FUNCTION set_next_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id = nextval('user_id_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_id_on_insert
BEFORE INSERT ON userdata
FOR EACH ROW EXECUTE FUNCTION set_next_id();


-- FOREIGN KEY (creator_id) REFERENCES YourTableName(id)
-- If you need to set constraints on mail_id and phone_number, you can add them like this:
-- ALTER TABLE YourTableName
-- ADD CONSTRAINT mail_unique UNIQUE (mail_id),
-- ADD CONSTRAINT phone_unique UNIQUE (phone_number);
