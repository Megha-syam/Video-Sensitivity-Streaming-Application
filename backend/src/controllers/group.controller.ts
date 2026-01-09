import { Response } from 'express';
import { body } from 'express-validator';
import Group from '../models/Group';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation rules
export const createGroupValidation = [
  body('group_name').trim().notEmpty().withMessage('Group name is required'),
  body('description').optional().trim(),
  body('users').isArray().withMessage('Users must be an array'),
];

// Get all groups for current user
export const getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;

    // Find groups where user is a member or creator
    const groups = await Group.find({
      $or: [{ users: userId }, { created_by: userId }],
    })
      .populate('users', 'name username email')
      .populate('created_by', 'name username')
      .sort({ createdAt: -1 });

    res.json({ groups });
  } catch (error: any) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create group
export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { group_name, description, users } = req.body;
    const userId = req.user._id;

    // Create group
    const group = new Group({
      group_name,
      description,
      users,
      created_by: userId,
    });

    await group.save();

    // Update users' groups array
    await User.updateMany(
      { _id: { $in: users } },
      { $addToSet: { groups: group._id } }
    );

    // Also add creator to the group if not already included
    if (!users.includes(userId.toString())) {
      await User.findByIdAndUpdate(userId, { $addToSet: { groups: group._id } });
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('users', 'name username email')
      .populate('created_by', 'name username');

    res.status(201).json({
      message: 'Group created successfully',
      group: populatedGroup,
    });
  } catch (error: any) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get group by ID
export const getGroupById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id)
      .populate('users', 'name username email')
      .populate('created_by', 'name username email');

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    // Check if user is a member or creator
    const isMember = group.users.some((u: any) => u._id.toString() === userId.toString());
    const isCreator = group.created_by._id.toString() === userId.toString();

    if (!isMember && !isCreator) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json({ group });
  } catch (error: any) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update group
export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { group_name, description, users } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    // Check if user is a member of the group (any member can update)
    const isMember = group.users.some((u: any) => u.toString() === userId.toString());
    const isCreator = group.created_by.toString() === userId.toString();

    if (!isMember) {
      res.status(403).json({ message: 'Only group members can update the group' });
      return;
    }

    // Update group details
    if (group_name) group.group_name = group_name;
    if (description !== undefined) group.description = description; // Allow setting description to empty string
    
    if (users) {
      const oldUsers = group.users.map((u: any) => u.toString());
      
      // Add new users to the group and update their group lists
      const usersToAdd = users.filter((u: string) => !oldUsers.includes(u));
      if (usersToAdd.length > 0) {
        await User.updateMany(
          { _id: { $in: usersToAdd } },
          { $addToSet: { groups: group._id } }
        );
      }

      // Remove users who are no longer in the group and update their group lists
      const usersToRemove = oldUsers.filter((u: string) => !users.includes(u));
      if (usersToRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: usersToRemove } },
          { $pull: { groups: group._id } }
        );
      }

      group.users = users; // Update the group's users array
    }

    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate('users', 'name username email')
      .populate('created_by', 'name username');

    res.json({ message: 'Group updated successfully', group: updatedGroup });
  } catch (error: any) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete group
export const deleteGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    // Only creator can delete
    if (group.created_by.toString() !== userId.toString()) {
      res.status(403).json({ message: 'Only the group creator can delete this group' });
      return;
    }

    // Remove group from all users
    await User.updateMany(
      { _id: { $in: group.users } },
      { $pull: { groups: group._id } }
    );

    await Group.findByIdAndDelete(id);

    res.json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
