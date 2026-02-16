//version 3.0 - Swing version
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class Tdl0 extends JFrame implements ActionListener {

    JTextField tf;
    JButton ab, rb, cb;
    JList<Task> tl;
    DefaultListModel<Task> listModel;
    JComboBox<String> priorityBox;


    public Tdl0() {

        setTitle("To-Do List");
        setSize(400, 400);
        setLayout(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        // Main title
        JLabel t = new JLabel("To Do list", JLabel.CENTER);
        t.setFont(new Font("Arial", Font.BOLD, 15));
        t.setBounds(120, 40, 150, 30);
        add(t);

        JLabel taskLabel = new JLabel("Enter Task:");
        taskLabel.setBounds(50, 90, 80, 25);
        add(taskLabel);

        tf = new JTextField();
        tf.setBounds(130, 90, 200, 25);
        add(tf);

        ab = new JButton("ADD");
        ab.setBounds(50, 150, 80, 30);
        add(ab);

        rb = new JButton("REMOVE");
        rb.setBounds(150, 150, 80, 30);
        add(rb);

        cb = new JButton("CLEAR ALL");
        cb.setBounds(250, 150, 80, 30);
        add(cb);

        listModel = new DefaultListModel<>();
        tl = new JList<>(listModel);
        tl.setSelectionMode(ListSelectionModel.MULTIPLE_INTERVAL_SELECTION);

        JScrollPane sp = new JScrollPane(tl);
        sp.setBounds(50, 180, 280, 150);
        add(sp);

        priorityBox = new JComboBox<>(new String[]{"High", "Medium", "Low"});
        priorityBox.setBounds(50, 120, 120, 25);
        add(priorityBox);


        ab.addActionListener(this);
        rb.addActionListener(this);
        cb.addActionListener(this);

        setVisible(true);
    }

    class Task {
    String title;
    String priority;

    Task(String title, String priority) {
        this.title = title;
        this.priority = priority;
    }

    public String toString() {
        return title + " [" + priority + "]";
    }
}


    public void actionPerformed(ActionEvent e) {

        String title = tf.getText().trim();
        String priority = (String) priorityBox.getSelectedItem();

        if (!title.isEmpty()) {
            listModel.addElement(new Task(title, priority));
            tf.setText("");
        }


        else if (e.getSource() == rb) {
            int[] selected = tl.getSelectedIndices();
            for (int i = selected.length - 1; i >= 0; i--) {
                listModel.remove(selected[i]);
            }
        }

        else if (e.getSource() == cb) {
            listModel.clear();
        }
    }

    public static void main(String[] args) {
        new Tdl0();
    }
}
